package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		if _, err := app.FindCollectionByNameOrId("avatar_shares"); err == nil {
			return nil
		}

		collection := core.NewBaseCollection("avatar_shares")
		collection.ViewRule = ptr("")
		collection.Fields.Add(
			&core.FileField{
				Name:      "image",
				Required:  true,
				MaxSize:   8388608,
				MimeTypes: []string{"image/png"},
			},
			&core.AutodateField{Name: "created", OnCreate: true},
		)

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("avatar_shares")
		if err != nil {
			return nil
		}

		return app.Delete(collection)
	})
}
