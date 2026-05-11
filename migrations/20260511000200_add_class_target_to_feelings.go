package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		feelings, err := app.FindCollectionByNameOrId("feelings")
		if err != nil {
			return err
		}

		classes, err := app.FindCollectionByNameOrId("classes")
		if err != nil {
			return err
		}

		if field := feelings.Fields.GetByName("target_type"); field != nil {
			if selectField, ok := field.(*core.SelectField); ok && !containsString(selectField.Values, "class") {
				selectField.Values = append(selectField.Values, "class")
			}
		}

		if feelings.Fields.GetByName("class_target") == nil {
			feelings.Fields.Add(&core.RelationField{
				Name:         "class_target",
				CollectionId: classes.Id,
				MaxSelect:    1,
			})
		}

		return app.Save(feelings)
	}, func(app core.App) error {
		feelings, err := app.FindCollectionByNameOrId("feelings")
		if err != nil {
			return nil
		}

		if field := feelings.Fields.GetByName("target_type"); field != nil {
			if selectField, ok := field.(*core.SelectField); ok {
				values := make([]string, 0, len(selectField.Values))
				for _, value := range selectField.Values {
					if value != "class" {
						values = append(values, value)
					}
				}
				selectField.Values = values
			}
		}

		if feelings.Fields.GetByName("class_target") != nil {
			feelings.Fields.RemoveByName("class_target")
		}

		return app.Save(feelings)
	})
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}

	return false
}
