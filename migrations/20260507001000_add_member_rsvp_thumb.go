package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		for _, collectionName := range []string{"members", "rsvps"} {
			collection, err := app.FindCollectionByNameOrId(collectionName)
			if err != nil {
				return err
			}

			if collection.Fields.GetByName("thumb") != nil {
				continue
			}

			collection.Fields.Add(&core.FileField{
				Name:      "thumb",
				MaxSize:   5242880,
				MimeTypes: []string{"image/jpeg", "image/png", "image/webp"},
			})

			if err := app.Save(collection); err != nil {
				return err
			}
		}

		return nil
	}, func(app core.App) error {
		for _, collectionName := range []string{"members", "rsvps"} {
			collection, err := app.FindCollectionByNameOrId(collectionName)
			if err != nil {
				continue
			}

			collection.Fields.RemoveByName("thumb")
			if err := app.Save(collection); err != nil {
				return err
			}
		}

		return nil
	})
}
