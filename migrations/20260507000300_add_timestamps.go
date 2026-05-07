package migrations

import (
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		collectionNames := []string{"members", "teachers", "gallery", "feelings"}

		for _, name := range collectionNames {
			collection, err := app.FindCollectionByNameOrId(name)
			if err != nil {
				return err
			}

			addAutodateField(collection, "created", true, false)
			addAutodateField(collection, "updated", true, true)

			if err := app.Save(collection); err != nil {
				return err
			}

			if err := backfillTimestamps(app, name); err != nil {
				return err
			}
		}

		return nil
	}, func(app core.App) error {
		collectionNames := []string{"members", "teachers", "gallery", "feelings"}

		for _, name := range collectionNames {
			collection, err := app.FindCollectionByNameOrId(name)
			if err != nil {
				continue
			}

			collection.Fields.RemoveByName("created")
			collection.Fields.RemoveByName("updated")

			if err := app.Save(collection); err != nil {
				return err
			}
		}

		return nil
	})
}

func addAutodateField(collection *core.Collection, name string, onCreate bool, onUpdate bool) {
	if collection.Fields.GetByName(name) != nil {
		return
	}

	collection.Fields.Add(&core.AutodateField{
		Name:     name,
		OnCreate: onCreate,
		OnUpdate: onUpdate,
	})
}

func backfillTimestamps(app core.App, collectionName string) error {
	records, err := app.FindAllRecords(collectionName)
	if err != nil {
		return err
	}

	base := types.NowDateTime().Add(-time.Duration(len(records)) * time.Second)
	for index, record := range records {
		timestamp := base.Add(time.Duration(index) * time.Second)

		updates := dbx.Params{}
		if record.GetDateTime("created").IsZero() {
			updates["created"] = timestamp.String()
		}

		if record.GetDateTime("updated").IsZero() {
			updates["updated"] = timestamp.String()
		}

		if len(updates) == 0 {
			continue
		}

		if _, err := app.DB().Update(collectionName, updates, dbx.HashExp{"id": record.Id}).Execute(); err != nil {
			return err
		}
	}

	return nil
}
