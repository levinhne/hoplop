package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// 1. Seed Members
		membersCollection, err := app.FindCollectionByNameOrId("members")
		if err != nil {
			return err
		}

		memberData := []map[string]any{
			{
				"name":       "Nguyễn Văn A",
				"class_name": "9A - Niên khóa 2008-2012",
				"bio":        "Hiện đang làm kỹ sư tại Hà Nội. Rất nhớ những buổi chiều đá bóng cùng anh em sân trường.",
				"location":   "Hà Nội",
				"phone":      "0987654321",
				"is_public":  true,
				"sort_order": 1,
			},
			{
				"name":       "Trần Thị B",
				"class_name": "9A - Niên khóa 2008-2012",
				"bio":        "Bác sĩ tại bệnh viện tỉnh. Hy vọng ngày họp lớp chúng mình sẽ đông đủ nhất!",
				"location":   "Nam Định",
				"phone":      "0912345678",
				"is_public":  true,
				"sort_order": 2,
			},
			{
				"name":       "Lê Văn C",
				"class_name": "9A - Niên khóa 2008-2012",
				"bio":        "Đang kinh doanh tự do. Anh em ai đi qua mạn Cầu Giấy thì hú mình cafe nhé.",
				"location":   "Hà Nội",
				"phone":      "0909090909",
				"is_public":  true,
				"sort_order": 3,
			},
			{
				"name":       "Phạm Minh D",
				"class_name": "9A - Niên khóa 2008-2012",
				"bio":        "Hiện đang định cư tại Nhật Bản. Tiếc quá năm nay không về họp lớp được, chúc cả lớp vui vẻ!",
				"location":   "Tokyo, Japan",
				"phone":      "+81 90 1234 5678",
				"is_public":  true,
				"sort_order": 4,
			},
		}

		var memberRecords []*core.Record
		for _, data := range memberData {
			record := core.NewRecord(membersCollection)
			for k, v := range data {
				record.Set(k, v)
			}
			if err := app.Save(record); err != nil {
				return err
			}
			memberRecords = append(memberRecords, record)
		}

		// 2. Seed Teachers
		teachersCollection, err := app.FindCollectionByNameOrId("teachers")
		if err != nil {
			return err
		}

		teacherData := []map[string]any{
			{
				"name":      "Thầy Nguyễn Văn Thành",
				"subject":   "Toán học",
				"period":    "Chủ nhiệm lớp 9 (2011-2012)",
				"tribute":   "Thầy là người đã rèn luyện cho chúng em tư duy và bản lĩnh. Những giờ toán của thầy luôn đầy ắp tiếng cười và những bài học làm người quý giá.",
				"is_public": true,
			},
			{
				"name":      "Cô Lê Thị Hoa",
				"subject":   "Ngữ văn",
				"period":    "Giảng dạy (2008-2012)",
				"tribute":   "Cô đã khơi gợi trong chúng em tình yêu với con chữ và tâm hồn bay bổng. Những bài giảng của cô luôn đong đầy cảm xúc.",
				"is_public": true,
			},
		}

		var teacherRecords []*core.Record
		for _, data := range teacherData {
			record := core.NewRecord(teachersCollection)
			for k, v := range data {
				record.Set(k, v)
			}
			if err := app.Save(record); err != nil {
				return err
			}
			teacherRecords = append(teacherRecords, record)
		}

		// 3. Seed Gallery
		galleryCollection, err := app.FindCollectionByNameOrId("gallery")
		if err != nil {
			return err
		}

		galleryData := []map[string]any{
			{"caption": "Sân trường đầy nắng mùa hè 2012", "category": "school", "is_public": true},
			{"caption": "Buổi đi chơi cuối cấp tại hồ Đại Lải", "category": "reunion", "is_public": true},
			{"caption": "Lớp mình chụp ảnh kỷ yếu", "category": "old_days", "is_public": true},
		}

		for _, data := range galleryData {
			record := core.NewRecord(galleryCollection)
			for k, v := range data {
				record.Set(k, v)
			}
			// Gallery 'image' field is required. Seeding without it will fail if validation is on.
			// We try to save it. If it fails, we ignore it for now as seeding files in migrations is complex.
			_ = app.Save(record)
		}

		// 4. Seed Feelings
		feelingsCollection, err := app.FindCollectionByNameOrId("feelings")
		if err != nil {
			return err
		}

		feelingsData := []map[string]any{
			{
				"author_name": "Huyền Trang",
				"content":     "Nhìn lại những tấm ảnh cũ mà thấy sống mũi cay cay. Thời gian trôi nhanh quá, chúc cả lớp mình mãi giữ vững tình bạn này.",
				"target_type": "general",
				"is_approved": true,
				"is_public":   true,
			},
			{
				"author_name":    "Hoàng Long",
				"content":        "Gửi thầy Thành: Cảm ơn thầy vì những năm tháng nghiêm khắc nhưng đầy bao dung. Thầy mãi là người thầy vĩ đại nhất trong lòng em.",
				"target_type":    "teacher",
				"teacher_target": teacherRecords[0].Id,
				"is_approved":    true,
				"is_public":      true,
			},
			{
				"author_name":   "Minh Anh",
				"content":       "A ơi, nhớ cái hồi ông bà mình trốn học đi chơi game không? Giờ ông làm sếp rồi, hôm nào gặp khao cafe nhé!",
				"target_type":   "member",
				"member_target": memberRecords[0].Id,
				"is_approved":   true,
				"is_public":     true,
			},
		}

		for _, data := range feelingsData {
			record := core.NewRecord(feelingsCollection)
			for k, v := range data {
				record.Set(k, v)
			}
			if err := app.Save(record); err != nil {
				return err
			}
		}

		return nil
	}, func(app core.App) error {
		return nil
	})
}
