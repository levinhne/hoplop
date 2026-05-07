package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		fieldOrders := map[string][]string{
			"members":  {"is_public", "created", "updated"},
			"teachers": {"is_public", "created", "updated"},
			"gallery":  {"category", "is_public", "created", "updated"},
			"feelings": {"target_type", "is_approved", "is_public", "created", "updated"},
			"rsvps":    {"status", "is_approved", "created", "updated"},
			"classes":  {"is_public", "created", "updated"},
		}

		for collectionName, orderedFieldNames := range fieldOrders {
			collection, err := app.FindCollectionByNameOrId(collectionName)
			if err != nil {
				continue
			}

			moveFieldsToEnd(collection, orderedFieldNames...)

			if err := app.Save(collection); err != nil {
				return err
			}
		}

		return nil
	}, func(app core.App) error {
		return nil
	})
}

func moveFieldsToEnd(collection *core.Collection, names ...string) {
	fields := make([]core.Field, 0, len(names))
	for _, name := range names {
		field := collection.Fields.GetByName(name)
		if field != nil {
			fields = append(fields, field)
		}
	}

	if len(fields) == 0 {
		return
	}

	collection.Fields.AddAt(len(collection.Fields)+1, fields...)
}
