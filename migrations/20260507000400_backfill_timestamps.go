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
			if err := backfillEmptyTimestampColumns(app, name); err != nil {
				return err
			}
		}

		return nil
	}, func(app core.App) error {
		return nil
	})
}

func backfillEmptyTimestampColumns(app core.App, collectionName string) error {
	records, err := app.FindAllRecords(collectionName)
	if err != nil {
		return err
	}

	base := types.NowDateTime().Add(-time.Duration(len(records)) * time.Second)
	for index, record := range records {
		timestamp := base.Add(time.Duration(index) * time.Second).String()
		updates := dbx.Params{}

		if record.GetDateTime("created").IsZero() {
			updates["created"] = timestamp
		}

		if record.GetDateTime("updated").IsZero() {
			updates["updated"] = timestamp
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
