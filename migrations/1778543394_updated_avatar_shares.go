package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3251075757")
		if err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(1, []byte(`{
			"help": "",
			"hidden": false,
			"id": "file3309110367",
			"maxSelect": 0,
			"maxSize": 8388608,
			"mimeTypes": [
				"image/png",
				"image/jpeg"
			],
			"name": "image",
			"presentable": false,
			"protected": false,
			"required": true,
			"system": false,
			"thumbs": null,
			"type": "file"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3251075757")
		if err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(1, []byte(`{
			"help": "",
			"hidden": false,
			"id": "file3309110367",
			"maxSelect": 0,
			"maxSize": 8388608,
			"mimeTypes": [
				"image/png"
			],
			"name": "image",
			"presentable": false,
			"protected": false,
			"required": true,
			"system": false,
			"thumbs": null,
			"type": "file"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
