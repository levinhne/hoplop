package migrations

import (
	"strings"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		classes, err := ensureClassesCollection(app)
		if err != nil {
			return err
		}

		members, err := app.FindCollectionByNameOrId("members")
		if err != nil {
			return err
		}

		if members.Fields.GetByName("class_ref") == nil {
			members.Fields.Add(&core.RelationField{
				Name:         "class_ref",
				CollectionId: classes.Id,
				MaxSelect:    1,
			})

			if err := app.Save(members); err != nil {
				return err
			}
		}

		return backfillMemberClassRefs(app, classes)
	}, func(app core.App) error {
		members, err := app.FindCollectionByNameOrId("members")
		if err == nil && members.Fields.GetByName("class_ref") != nil {
			members.Fields.RemoveByName("class_ref")
			if err := app.Save(members); err != nil {
				return err
			}
		}

		classes, err := app.FindCollectionByNameOrId("classes")
		if err != nil {
			return nil
		}

		return app.Delete(classes)
	})
}

func ensureClassesCollection(app core.App) (*core.Collection, error) {
	classes, err := app.FindCollectionByNameOrId("classes")
	if err == nil {
		return classes, nil
	}

	classes = core.NewBaseCollection("classes")
	classes.ListRule = ptr("is_public = true")
	classes.ViewRule = ptr("is_public = true")
	classes.Fields.Add(
		&core.TextField{Name: "name", Required: true},
		&core.TextField{Name: "school_year"},
		&core.TextField{Name: "description"},
		&core.NumberField{Name: "sort_order"},
		&core.BoolField{Name: "is_public"},
		&core.AutodateField{Name: "created", OnCreate: true},
		&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
	)

	if err := app.Save(classes); err != nil {
		return nil, err
	}

	return classes, nil
}

func backfillMemberClassRefs(app core.App, classes *core.Collection) error {
	members, err := app.FindAllRecords("members")
	if err != nil {
		return err
	}

	classByName := map[string]*core.Record{}
	sortOrder := 1

	for _, member := range members {
		if member.GetString("class_ref") != "" {
			continue
		}

		className := strings.TrimSpace(member.GetString("class_name"))
		if className == "" {
			continue
		}

		classRecord := classByName[className]
		if classRecord == nil {
			existing, _ := app.FindFirstRecordByFilter(
				"classes",
				"name = {:name}",
				dbx.Params{"name": className},
			)

			if existing != nil {
				classRecord = existing
			} else {
				classRecord = core.NewRecord(classes)
				classRecord.Set("name", className)
				classRecord.Set("sort_order", sortOrder)
				classRecord.Set("is_public", true)

				if err := app.Save(classRecord); err != nil {
					return err
				}
			}

			classByName[className] = classRecord
			sortOrder++
		}

		member.Set("class_ref", classRecord.Id)
		if err := app.Save(member); err != nil {
			return err
		}
	}

	return nil
}
