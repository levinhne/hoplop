package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func ptr[T any](v T) *T {
	return &v
}

func init() {
	m.Register(func(app core.App) error {
		// 1. Members Collection
		members := core.NewBaseCollection("members")
		members.ListRule = ptr("is_public = true")
		members.ViewRule = ptr("is_public = true")
		members.Fields.Add(
			&core.TextField{Name: "name", Required: true},
			&core.FileField{Name: "avatar", MaxSize: 5242880, MimeTypes: []string{"image/jpeg", "image/png", "image/webp"}},
			&core.EditorField{Name: "bio"},
			&core.TextField{Name: "class_name"},
			&core.TextField{Name: "phone"},
			&core.TextField{Name: "location"},
			&core.NumberField{Name: "sort_order"},
			&core.BoolField{Name: "is_public"},
			&core.AutodateField{Name: "created", OnCreate: true},
			&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
		)
		if err := app.Save(members); err != nil {
			return err
		}

		// 2. Teachers Collection
		teachers := core.NewBaseCollection("teachers")
		teachers.ListRule = ptr("is_public = true")
		teachers.ViewRule = ptr("is_public = true")
		teachers.Fields.Add(
			&core.TextField{Name: "name", Required: true},
			&core.TextField{Name: "subject"},
			&core.TextField{Name: "period"},
			&core.FileField{Name: "avatar", MaxSize: 5242880, MimeTypes: []string{"image/jpeg", "image/png", "image/webp"}},
			&core.EditorField{Name: "tribute"},
			&core.BoolField{Name: "is_public"},
			&core.AutodateField{Name: "created", OnCreate: true},
			&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
		)
		if err := app.Save(teachers); err != nil {
			return err
		}

		// 3. Gallery Collection
		gallery := core.NewBaseCollection("gallery")
		gallery.ListRule = ptr("is_public = true")
		gallery.ViewRule = ptr("is_public = true")
		gallery.Fields.Add(
			&core.FileField{Name: "image", Required: true, MaxSize: 10485760, MimeTypes: []string{"image/jpeg", "image/png", "image/webp"}},
			&core.TextField{Name: "caption"},
			&core.SelectField{Name: "category", Values: []string{"school", "reunion", "old_days"}},
			&core.BoolField{Name: "is_public"},
			&core.AutodateField{Name: "created", OnCreate: true},
			&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
		)
		if err := app.Save(gallery); err != nil {
			return err
		}

		// 4. Feelings Collection
		feelings := core.NewBaseCollection("feelings")
		feelings.ListRule = ptr("is_approved = true && is_public = true")
		feelings.ViewRule = ptr("is_approved = true && is_public = true")
		feelings.CreateRule = ptr("")
		feelings.Fields.Add(
			&core.TextField{Name: "author_name", Required: true},
			&core.TextField{Name: "content", Required: true},
			&core.SelectField{Name: "target_type", Values: []string{"general", "teacher", "member"}},
			&core.RelationField{Name: "teacher_target", CollectionId: teachers.Id, MaxSelect: 1},
			&core.RelationField{Name: "member_target", CollectionId: members.Id, MaxSelect: 1},
			&core.FileField{Name: "attachment", MaxSize: 5242880, MimeTypes: []string{"image/jpeg", "image/png", "image/webp"}},
			&core.BoolField{Name: "is_approved"},
			&core.BoolField{Name: "is_public"},
			&core.AutodateField{Name: "created", OnCreate: true},
			&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
		)
		if err := app.Save(feelings); err != nil {
			return err
		}

		// 5. RSVPs Collection
		rsvps := core.NewBaseCollection("rsvps")
		rsvps.ListRule = ptr("is_approved = true")
		rsvps.ViewRule = ptr("is_approved = true")
		rsvps.CreateRule = ptr("")
		rsvps.Fields.Add(
			&core.TextField{Name: "full_name", Required: true},
			&core.TextField{Name: "class_year"},
			&core.TextField{Name: "contact", Required: true},
			&core.NumberField{Name: "guest_count", OnlyInt: true},
			&core.TextField{Name: "note"},
			&core.SelectField{Name: "status", Values: []string{"attending", "maybe", "not_attending"}},
			&core.BoolField{Name: "is_approved"},
			&core.AutodateField{Name: "created", OnCreate: true},
			&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
		)
		if err := app.Save(rsvps); err != nil {
			return err
		}

		return nil
	}, func(app core.App) error {
		collections := []string{"rsvps", "feelings", "gallery", "teachers", "members"}
		for _, name := range collections {
			collection, err := app.FindCollectionByNameOrId(name)
			if err == nil {
				if err := app.Delete(collection); err != nil {
					return err
				}
			}
		}
		return nil
	})
}
