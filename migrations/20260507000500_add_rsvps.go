package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		if _, err := app.FindCollectionByNameOrId("rsvps"); err == nil {
			return nil
		}

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

		return app.Save(rsvps)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("rsvps")
		if err != nil {
			return nil
		}

		return app.Delete(collection)
	})
}
