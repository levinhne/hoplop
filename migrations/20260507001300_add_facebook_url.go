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

			if collection.Fields.GetByName("facebook_url") != nil {
				continue
			}

			collection.Fields.Add(&core.URLField{Name: "facebook_url"})

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

			collection.Fields.RemoveByName("facebook_url")
			if err := app.Save(collection); err != nil {
				return err
			}
		}

		return nil
	})
}
