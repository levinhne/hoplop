package main

import (
	"io"
	"io/fs"
	"log"
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

		e.Router.GET("/{path...}", apis.Static(subFS, true))

		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
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
