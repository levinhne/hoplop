package migrations

import (
	"strings"
	"unicode"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		rsvps, err := app.FindCollectionByNameOrId("rsvps")
		if err != nil {
			return err
		}

		records, err := app.FindAllRecords("rsvps")
		if err != nil {
			return err
		}

		for _, record := range records {
			contact := normalizeRsvpContact(record.GetString("contact"))
			if contact == "" || record.GetString("contact") == contact {
				continue
			}

			record.Set("contact", contact)
			if err := app.Save(record); err != nil {
				return err
			}
		}

		if rsvps.Fields.GetByName("contact_key") == nil {
			return nil
		}

		rsvps.Fields.RemoveByName("contact_key")
		return app.Save(rsvps)
	}, func(app core.App) error {
		return nil
	})
}

func normalizeRsvpContact(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return ""
	}

	var digits strings.Builder
	for _, r := range value {
		if unicode.IsDigit(r) {
			digits.WriteRune(r)
		}
	}

	digitValue := digits.String()
	if len(digitValue) >= 6 {
		digitValue = strings.TrimPrefix(digitValue, "00")
		if strings.HasPrefix(digitValue, "84") && len(digitValue) > 9 {
			return "0" + strings.TrimPrefix(digitValue, "84")
		}
		return digitValue
	}

	var compact strings.Builder
	for _, r := range value {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			compact.WriteRune(r)
		}
	}

	return compact.String()
}
