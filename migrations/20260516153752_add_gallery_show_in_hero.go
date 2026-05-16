package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		gallery, err := app.FindCollectionByNameOrId("gallery")
		if err != nil {
			return err
		}

		if gallery.Fields.GetByName("show_in_hero") == nil {
			gallery.Fields.Add(&core.BoolField{Name: "show_in_hero"})
		}

		moveFieldsToEnd(gallery, "show_in_hero", "is_public", "created", "updated")

		return app.Save(gallery)
	}, func(app core.App) error {
		gallery, err := app.FindCollectionByNameOrId("gallery")
		if err != nil {
			return nil
		}

		if gallery.Fields.GetByName("show_in_hero") != nil {
			gallery.Fields.RemoveByName("show_in_hero")
		}

		return app.Save(gallery)
	})
}
