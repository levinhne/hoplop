package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		classes, err := ensureClassesCollection(app)
		if err != nil {
			return err
		}

		if err := backfillMemberClassRefs(app, classes); err != nil {
			return err
		}

		members, err := app.FindCollectionByNameOrId("members")
		if err != nil {
			return err
		}

		if members.Fields.GetByName("class_name") == nil {
			return nil
		}

		members.Fields.RemoveByName("class_name")
		return app.Save(members)
	}, func(app core.App) error {
		members, err := app.FindCollectionByNameOrId("members")
		if err != nil {
			return err
		}

		if members.Fields.GetByName("class_name") == nil {
			members.Fields.Add(&core.TextField{Name: "class_name"})
			if err := app.Save(members); err != nil {
				return err
			}
		}

		return restoreMemberClassNames(app)
	})
}

func restoreMemberClassNames(app core.App) error {
	members, err := app.FindAllRecords("members")
	if err != nil {
		return err
	}

	for _, member := range members {
		classRef := member.GetString("class_ref")
		if classRef == "" {
			continue
		}

		classRecord, err := app.FindRecordById("classes", classRef)
		if err != nil {
			continue
		}

		member.Set("class_name", classRecord.GetString("name"))
		if err := app.Save(member); err != nil {
			return err
		}
	}

	return nil
}
