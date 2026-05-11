package main

import (
	"fmt"
	"html"
	"io"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"unicode"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/ghupdate"
	"github.com/pocketbase/pocketbase/plugins/jsvm"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/pocketbase/pocketbase/tools/filesystem"

	_ "hoplopthcs/migrations"
	"hoplopthcs/web"
)

func main() {
	// app
	app := pocketbase.New()

	// migration command
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: true,
	})

	// check for updates
	ghupdate.MustRegister(app, app.RootCmd, ghupdate.Config{})

	// enable JSVM to run migrations from JS files
	jsvm.MustRegister(app, jsvm.Config{})

	// hook for feelings: force is_approved=false for non-superusers
	app.OnRecordCreateRequest("feelings").BindFunc(func(e *core.RecordRequestEvent) error {
		if !e.HasSuperuserAuth() {
			e.Record.Set("is_approved", false)
			e.Record.Set("is_public", true) // Default public to true
		}
		return e.Next()
	})

	// hook for RSVPs: public submissions are recorded but wait for organizer review
	app.OnRecordCreateRequest("rsvps").BindFunc(func(e *core.RecordRequestEvent) error {
		contact := normalizeContact(e.Record.GetString("contact"))
		if contact != "" {
			existing, _ := e.App.FindFirstRecordByFilter(
				"rsvps",
				"contact = {:contact}",
				map[string]any{"contact": contact},
			)
			if existing != nil {
				return e.BadRequestError(
					"Số điện thoại/Zalo này đã được gửi trước đó.",
					map[string]any{
						"code":  "duplicate_contact",
						"field": "contact",
					},
				)
			}

			e.Record.Set("contact", contact)
		}

		if !e.HasSuperuserAuth() {
			e.Record.Set("is_approved", false)
		}
		return e.Next()
	})

	// hook for RSVPs: when approved, sync data to members collection
	app.OnRecordUpdate("rsvps").BindFunc(func(e *core.RecordEvent) error {
		// First, execute the actual update
		if err := e.Next(); err != nil {
			return err
		}

		// Logic AFTER the update
		// Only proceed if approved is true
		if e.Record.GetBool("is_approved") {
			members, err := e.App.FindCollectionByNameOrId("members")
			if err != nil {
				return nil // Collection not found, just skip
			}

			// Try to find an existing member with the same name and phone
			name := e.Record.GetString("full_name")
			phone := e.Record.GetString("contact")

			existing, _ := e.App.FindFirstRecordByFilter(
				"members",
				"name = {:name} && phone = {:phone}",
				map[string]any{"name": name, "phone": phone},
			)

			var member *core.Record
			if existing != nil {
				member = existing
			} else {
				member = core.NewRecord(members)
			}

			member.Set("name", name)
			member.Set("phone", phone)
			member.Set("facebook_url", e.Record.GetString("facebook_url"))
			className := e.Record.GetString("class_year")
			if classRecord, err := findOrCreateClass(e.App, className); err == nil && classRecord != nil {
				member.Set("class_ref", classRecord.Id)
			}
			member.Set("location", e.Record.GetString("location"))
			member.Set("bio", e.Record.GetString("bio"))
			member.Set("is_public", true)

			if err := copyRsvpFileToMember(e.App, e.Record, member, "thumb"); err != nil {
				log.Printf("Error syncing RSVP thumb to Member: %v", err)
			}

			if err := e.App.Save(member); err != nil {
				log.Printf("Error syncing RSVP to Member: %v", err)
			}
		}
		return nil
	})

	// serves static files from the embedded web/dist
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		// Use fs.Sub to serve the content of the "dist" folder within web.DistDir
		subFS, err := fs.Sub(web.DistDir, "dist")
		if err != nil {
			return err
		}

		e.Router.POST("/api/avatar-shares", func(e *core.RequestEvent) error {
			return createAvatarShare(e)
		})
		e.Router.GET("/avatar/share/{id}", func(e *core.RequestEvent) error {
			return renderAvatarSharePage(e)
		})
		e.Router.GET("/{path...}", apis.Static(subFS, true))

		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

func createAvatarShare(e *core.RequestEvent) error {
	e.Request.Body = http.MaxBytesReader(e.Response, e.Request.Body, 8<<20)

	files, err := e.FindUploadedFiles("image")
	if err != nil || len(files) == 0 {
		return e.BadRequestError("Vui lòng gửi file ảnh avatar.", err)
	}

	expectedCode := strings.TrimSpace(os.Getenv("REUNION_ACCESS_CODE"))
	if expectedCode == "" {
		expectedCode = "31/05"
	}
	if expectedCode != "" {
		accessCode := strings.TrimSpace(e.Request.FormValue("access_code"))
		if accessCode != expectedCode {
			return e.ForbiddenError("Ngày hội ngộ chưa đúng.", nil)
		}
	}

	collection, err := e.App.FindCollectionByNameOrId("avatar_shares")
	if err != nil {
		return e.InternalServerError("Chưa cấu hình nơi lưu avatar.", err)
	}

	record := core.NewRecord(collection)
	record.Set("image", files[0])

	if err := e.App.Save(record); err != nil {
		return e.BadRequestError("Không lưu được ảnh avatar.", err)
	}

	shareURL := absoluteURL(e, "/avatar/share/"+record.Id)
	imageURL := avatarShareImageURL(e, record)

	return e.JSON(http.StatusOK, map[string]string{
		"shareUrl":         shareURL,
		"imageUrl":         imageURL,
		"facebookShareUrl": facebookShareURL(shareURL),
	})
}

func renderAvatarSharePage(e *core.RequestEvent) error {
	id := e.Request.PathValue("id")
	record, err := e.App.FindRecordById("avatar_shares", id)
	if err != nil {
		return e.NotFoundError("Không tìm thấy avatar.", err)
	}

	imageURL := avatarShareImageURL(e, record)
	shareURL := absoluteURL(e, "/avatar/share/"+record.Id)
	title := "Avatar Giao Lộ Khối 9"
	description := "Một tấm ảnh, một lời hẹn gặp lại cùng Giao Lộ Khối 9."

	page := fmt.Sprintf(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%s</title>
  <meta name="description" content="%s">
  <meta property="og:type" content="website">
  <meta property="og:title" content="%s">
  <meta property="og:description" content="%s">
  <meta property="og:url" content="%s">
  <meta property="og:image" content="%s">
  <meta property="og:image:width" content="1080">
  <meta property="og:image:height" content="1080">
  <meta property="og:image:type" content="image/png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="%s">
  <meta name="twitter:description" content="%s">
  <meta name="twitter:image" content="%s">
</head>
<body style="margin:0;background:#FDFCF8;color:#2D2D2D;font-family:Arial,sans-serif;">
  <main style="box-sizing:border-box;min-height:100vh;display:grid;place-items:center;padding:24px;">
    <section style="max-width:520px;text-align:center;">
      <img src="%s" alt="%s" width="1080" height="1080" style="width:100%%;height:auto;border-radius:16px;box-shadow:0 12px 34px rgba(27,67,50,.16);">
      <h1 style="font-size:28px;line-height:1.2;margin:24px 0 8px;">%s</h1>
      <p style="color:#704214;line-height:1.6;margin:0 0 24px;">%s</p>
      <a href="/avatar" style="display:inline-block;background:#1B4332;color:#fff;text-decoration:none;padding:13px 18px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Tạo avatar của bạn</a>
    </section>
  </main>
</body>
</html>`,
		html.EscapeString(title),
		html.EscapeString(description),
		html.EscapeString(title),
		html.EscapeString(description),
		html.EscapeString(shareURL),
		html.EscapeString(imageURL),
		html.EscapeString(title),
		html.EscapeString(description),
		html.EscapeString(imageURL),
		html.EscapeString(imageURL),
		html.EscapeString(title),
		html.EscapeString(title),
		html.EscapeString(description),
	)

	return e.HTML(http.StatusOK, page)
}

func avatarShareImageURL(e *core.RequestEvent, record *core.Record) string {
	filename := record.GetString("image")
	return absoluteURL(e, "/api/files/avatar_shares/"+record.Id+"/"+filename)
}

func facebookShareURL(shareURL string) string {
	return "https://www.facebook.com/sharer/sharer.php?u=" + url.QueryEscape(shareURL)
}

func absoluteURL(e *core.RequestEvent, path string) string {
	scheme := "http"
	if e.Request.TLS != nil {
		scheme = "https"
	}
	if forwardedProto := strings.TrimSpace(e.Request.Header.Get("X-Forwarded-Proto")); forwardedProto != "" {
		scheme = strings.Split(forwardedProto, ",")[0]
	}

	host := strings.TrimSpace(e.Request.Host)
	if forwardedHost := strings.TrimSpace(e.Request.Header.Get("X-Forwarded-Host")); forwardedHost != "" {
		host = strings.Split(forwardedHost, ",")[0]
	}
	if host == "" {
		host = strings.TrimRight(e.App.Settings().Meta.AppURL, "/")
		return host + path
	}

	return scheme + "://" + host + path
}

func findOrCreateClass(app core.App, name string) (*core.Record, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, nil
	}

	classes, err := app.FindCollectionByNameOrId("classes")
	if err != nil {
		return nil, err
	}

	existing, _ := app.FindFirstRecordByFilter(
		"classes",
		"name = {:name}",
		map[string]any{"name": name},
	)
	if existing != nil {
		return existing, nil
	}

	record := core.NewRecord(classes)
	record.Set("name", name)
	record.Set("is_public", true)

	if err := app.Save(record); err != nil {
		return nil, err
	}

	return record, nil
}

func normalizeContact(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return ""
	}

	var digits strings.Builder
	for _, r := range value {
		if unicode.IsDigit(r) {
			digits.WriteRune(r)
		}
	}

	digitValue := digits.String()
	if len(digitValue) >= 6 {
		digitValue = strings.TrimPrefix(digitValue, "00")
		if strings.HasPrefix(digitValue, "84") && len(digitValue) > 9 {
			return "0" + strings.TrimPrefix(digitValue, "84")
		}
		return digitValue
	}

	var compact strings.Builder
	for _, r := range value {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			compact.WriteRune(r)
		}
	}

	return compact.String()
}

func copyRsvpFileToMember(app core.App, rsvp *core.Record, member *core.Record, fieldName string) error {
	filename := rsvp.GetString(fieldName)
	if filename == "" {
		return nil
	}

	fileSystem, err := app.NewFilesystem()
	if err != nil {
		return err
	}
	defer fileSystem.Close()

	srcPath := rsvp.BaseFilesPath() + "/" + filename
	exists, err := fileSystem.Exists(srcPath)
	if err != nil || !exists {
		return err
	}

	r, err := fileSystem.GetFile(srcPath)
	if err != nil {
		return err
	}
	defer r.Close()

	content, err := io.ReadAll(r)
	if err != nil {
		return err
	}

	file, err := filesystem.NewFileFromBytes(content, filename)
	if err != nil {
		return err
	}

	member.Set(fieldName, file)
	return nil
}
