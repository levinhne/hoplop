package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		rsvps, err := app.FindCollectionByNameOrId("rsvps")
		if err != nil {
			return err
		}

		// Add missing fields to RSVPs to match Members
		rsvps.Fields.Add(
			&core.FileField{Name: "avatar", MaxSize: 5242880, MimeTypes: []string{"image/jpeg", "image/png", "image/webp"}},
			&core.EditorField{Name: "bio"},
			&core.TextField{Name: "location"},
		)

		return app.Save(rsvps)
	}, func(app core.App) error {
		rsvps, err := app.FindCollectionByNameOrId("rsvps")
		if err != nil {
			return err
		}

		// Remove fields if needed (rollback)
		rsvps.Fields.RemoveByName("avatar")
		rsvps.Fields.RemoveByName("bio")
		rsvps.Fields.RemoveByName("location")

		return app.Save(rsvps)
	})
}
