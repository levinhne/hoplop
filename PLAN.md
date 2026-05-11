# PLAN - Hệ thống Landing Page Họp Lớp (React + TanStack + PocketBase)

## 1. Tech Stack

- **Backend**: PocketBase (Custom Go App)
  - Quản lý Database, Auth, File Storage.
  - Viết Hook (Go) để xử lý logic backend (vd: kiểm duyệt cảm nhận).
  - Serve Frontend SPA (nhúng thư mục `web/dist`).
- **Frontend**: ReactJS (Vite + TypeScript)
  - **Routing**: TanStack Router (Type-safe, file-based routing).
  - **Data Fetching**: TanStack Query (v5).
- **UI**: shadcn/ui + Tailwind CSS + Lucide Icons.
- **Form**: React Hook Form + Zod.
- **State**: Zustand (cho các global UI state).
- **Loading UX**: Mọi màn hình FE có fetch dữ liệu phải có Skeleton state nhất quán trước khi render dữ liệu thật.

---

## 2. Thiết kế Cơ sở dữ liệu (PocketBase Collections)

### Collection: `classes` (Lớp/Niên khóa)
| Field | Type | Note |
| :--- | :--- | :--- |
| `name` | Text (Required) | Tên lớp hiển thị, ví dụ `9A` |
| `school_year` | Text | Niên khóa/giai đoạn, ví dụ `2008-2012` |
| `description` | Text | Ghi chú thêm nếu cần |
| `sort_order` | Number | Thứ tự hiển thị/filter |
| `is_public` | Bool | Cho phép hiển thị lên web |
| `created` | Autodate | Thời điểm tạo |
| `updated` | Autodate | Thời điểm cập nhật |

### Collection: `members`
| Field | Type | Note |
| :--- | :--- | :--- |
| `name` | Text (Required) | Tên thành viên |
| `avatar` | File (Image) | Ảnh đại diện |
| `bio` | Editor/Text | Giới thiệu bản thân |
| `class_ref` | Relation | Link tới `classes` |
| `phone` | Text | Số điện thoại |
| `location` | Text | Nơi ở hiện tại |
| `is_public` | Bool | Cho phép hiển thị lên web |
| `sort_order` | Number | Thứ tự hiển thị |

### Collection: `teachers`
| Field | Type | Note |
| :--- | :--- | :--- |
| `name` | Text (Required) | Tên Thầy Cô |
| `subject` | Text | Môn giảng dạy |
| `period` | Text | Giai đoạn giảng dạy |
| `avatar` | File (Image) | Ảnh chân dung |
| `tribute` | Editor/Text | Lời tri ân từ học sinh |
| `is_public` | Bool | Trạng thái hiển thị |

### Collection: `gallery`
| Field | Type | Note |
| :--- | :--- | :--- |
| `image` | File (Image) | File ảnh kỷ niệm |
| `caption` | Text | Chú thích ảnh |
| `category` | Select | `school`, `reunion`, `old_days` |
| `is_public` | Bool | Trạng thái hiển thị |

### Collection: `feelings` (Lời nhắn gửi)
| Field | Type | Note |
| :--- | :--- | :--- |
| `author_name` | Text (Req) | Người viết |
| `content` | Text (Req) | Nội dung |
| `target_type` | Select | `general`, `teacher`, `member` |
| `teacher_target`| Relation | Link tới `teachers` (nếu target là teacher) |
| `member_target` | Relation | Link tới `members` (nếu target là member) |
| `attachment` | File (Image) | Ảnh đính kèm (vd: thư tay, ảnh cũ) |
| `is_approved` | Bool | Mặc định `false` (cần duyệt) |
| `is_public` | Bool | Mặc định `true` |

### Collection: `rsvps` (Xác nhận tham gia)
| Field | Type | Note |
| :--- | :--- | :--- |
| `full_name` | Text (Req) | Họ tên người xác nhận |
| `class_year` | Text | Lớp/niên khóa hoặc nhóm liên quan |
| `contact` | Text (Req) | Số điện thoại hoặc Zalo để BTC liên hệ |
| `status` | Select | `attending`, `maybe`, `not_attending` |
| `guest_count` | Number | Số người đi cùng |
| `note` | Text | Ghi chú ngắn cho BTC |
| `is_approved` | Bool | Mặc định `false` nếu muốn duyệt trước khi thống kê công khai |
| `created` | Autodate | Thời điểm gửi xác nhận |
| `updated` | Autodate | Thời điểm cập nhật |

---

## 3. Cấu trúc thư mục (`web/`)

```txt
web/
├── src/
│   ├── main.tsx           # Entry point
│   ├── router.tsx         # TanStack Router instance
│   ├── routeTree.gen.ts   # Generated routes
│   ├── lib/
│   │   ├── pocketbase.ts  # Client SDK
│   │   ├── query-client.ts# Query Client
│   │   └── utils.ts       # cn() helper
│   ├── routes/            # File-based routing
│   │   ├── __root.tsx     # Root Layout
│   │   ├── index.tsx      # Landing Page
│   │   ├── members/       # Danh sách & Chi tiết bạn bè
│   │   ├── teachers/      # Tri ân Thầy Cô
│   │   ├── feelings/      # Lời nhắn gửi
│   │   └── gallery.tsx    # Album ảnh
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── shared/        # Reusable cards, modals
│   │   └── layout/        # Navbar, Footer
│   ├── hooks/             # useMembers, useTeachers
│   ├── schema/            # Zod schemas
│   ├── stores/            # Zustand stores
│   └── styles/            # globals.css
```

---

## 4. Lộ trình triển khai (Phases)

### Phase 1: Backend Go & PocketBase Schema
- [x] Khởi tạo `cmd/server/main.go` chạy PocketBase Custom.
- [x] Thiết lập đầy đủ 4 Collections chính trong Admin UI.
- [x] Viết Hook Go ép `is_approved = false` cho cảm nhận mới.
- **Kết quả**: PocketBase hoạt động, đã khởi tạo Schema thông qua migrations.
- **Trạng thái app**: Backend chạy tại port 8090, truy cập được Admin UI.

### Phase 2: Frontend Foundation (Vite + Routing)
- [x] Khởi tạo thư mục `web/` bằng Vite.
- [x] Cài đặt Tailwind, shadcn/ui, TanStack Router & Query.
- [x] Thiết lập SDK kết nối Backend.
- [x] Dựng khung Navbar/Footer và trang Landing placeholder.
- **Kết quả**: Truy cập được giao diện khung của web qua Vite dev server.
- **Trạng thái app**: Web hiện trang Hero tĩnh và Navbar điều hướng placeholder.

### Phase 3: Core Features (Listing & Details)
- [x] Thực hiện fetch dữ liệu Members & Teachers qua TanStack Query.
- [x] Xây dựng các trang danh sách bằng shadcn Card.
- [x] Xây dựng Modal chi tiết (Dialog) hiển thị bio/tribute.
- **Kết quả**: Xem được danh sách bạn bè, Thầy Cô với dữ liệu thật từ DB.
- **Trạng thái app**: Danh sách hiển thị động, có thể bấm xem chi tiết từng người.

### Phase 4: Lời nhắn gửi (Targeted Feelings)
- [x] Xây dựng Form gửi cảm nhận (Zod + React Hook Form).
- [x] Tích hợp chọn đối tượng gửi (Cả lớp/Thầy Cô/Bạn bè).
- [x] Hiển thị danh sách lời nhắn đã được duyệt, sort mới nhất trước bằng `created`.
- [x] Upload ảnh đính kèm (ẩn tạm trên UI, giữ schema backend để bật lại sau).
- **Kết quả**: Người dùng có thể gửi lời nhắn "địa chỉ hóa" tới cả lớp, Thầy Cô hoặc bạn bè.
- **Trạng thái app**: Form gửi hoạt động, dữ liệu được đẩy về DB chờ duyệt.

### Phase 5: Gallery & Final Refinement
- [x] Xây dựng trang Gallery ảnh kỷ niệm theo phân loại.
- [x] Tối ưu trình bày trang Lưu bút khi nhiều dữ liệu: filter theo nhóm người nhận, grid responsive, preview nội dung và dialog đọc đầy đủ.
- [x] Tối ưu UI/UX, responsive và các hiệu ứng chuyển trang mượt mà.
- [x] Kiểm tra lại toàn bộ luồng kiểm duyệt dữ liệu.
- **Kết quả**: Website hoàn chỉnh với đầy đủ tính năng album và lời nhắn.
- **Trạng thái app**: Mọi trang đều hoạt động với dữ liệu động.

### Phase 6: Xác nhận tham gia (RSVP)
- [x] Tạo collection `rsvps` trong PocketBase migration.
- [x] Xây dựng form "Tham gia" nhẹ, không cần đăng nhập/đăng ký.
- [x] Thu thập: họ tên, lớp/niên khóa, SĐT/Zalo, trạng thái tham gia, số người đi cùng, ghi chú.
- [x] Kết nối nút "Tham gia" trên header/trang chủ tới form RSVP.
- [x] Hiển thị thông báo gửi thành công và trạng thái chờ BTC liên hệ/xác nhận.
- [x] Bổ sung thống kê số người xác nhận nếu phù hợp.
- **Kết quả**: Người dùng có thể xác nhận tham gia mà không cần tài khoản.
- **Trạng thái app**: BTC xem danh sách RSVP trong PocketBase Admin.

### Phase 7: Build & Production Embed
- [x] Build Frontend thành static files (`web/dist`).
- [x] Cập nhật Go Backend để nhúng và phục vụ `web/dist`.
- [x] Xóa bỏ code Go Template/HTMX cũ.
- **Kết quả**: Một file binary duy nhất chứa cả Backend và Frontend.
- **Trạng thái app**: Chạy `./server serve` là có đầy đủ cả hệ thống.

---

## 5. TODO — Sửa lỗi & Cải thiện (Post-Review)

### Bug Fixes (Ưu tiên cao)
- [x] **Fix avatar sync trong hook RSVP→Member** (`cmd/server/main.go`): Code cũ chỉ set tên file thay vì thực sự copy bytes từ storage của RSVP sang Member. Sửa bằng cách đọc bytes qua `filesystem.GetFile` + `filesystem.NewFileFromBytes`.
- [x] **Xóa `web/src/App.tsx` và `web/src/App.css`**: File boilerplate Vite cũ còn sót, không được sử dụng, gây nhầm lẫn.

### Refactor (Ưu tiên trung bình)
- [x] **Tách `normalizeText` và `normalizeSearch` ra `lib/utils.ts`**: Hai hàm này đang bị duplicate ở `members.tsx`, `teachers.tsx`, `feelings.tsx`, `index.tsx`. Di chuyển vào utils và import lại để nhất quán.
- [x] **Thêm ô tìm kiếm tên cho trang Thầy Cô** (`routes/teachers.tsx`): Trang Members đã có search, Teachers thì chưa — thêm vào để đồng nhất UX.
- [x] **Tách `class_name` thành collection `classes` riêng**:
  - Backend: tạo migration thêm collection `classes`.
  - Backend: thêm `members.class_ref` relation tới `classes`; bỏ `members.class_name` sau khi backfill.
  - Migration dữ liệu: gom các giá trị `members.class_name` hiện có thành records trong `classes`, sau đó backfill `members.class_ref`.
  - Frontend types/hooks: thêm `ClassGroup` type, `useClasses`, expand `class_ref` trong `useMembers`.
  - Frontend Members: filter theo `expand.class_ref.name`.
  - Frontend RSVP: cân nhắc đổi `class_year` text sang relation `class_ref` sau khi UX chọn lớp đã ổn.

### Bảo mật (Ưu tiên trung bình)
- [ ] **Sanitize HTML trong Feeling content**: Hiện tại dùng regex `.replace(/<[^>]*>/g, ' ')` để strip HTML — không an toàn nếu content có XSS payload phức tạp. Cân nhắc thêm `DOMPurify` hoặc sanitize server-side trong PocketBase hook.
- [ ] **Rate limiting trên public endpoints**: Feelings và RSVPs cho phép submit không giới hạn. Có thể thêm hook Go kiểm tra frequency theo IP, hoặc thêm CAPTCHA đơn giản phía frontend.

### Cải thiện nhỏ (Ưu tiên thấp)
- [ ] **Áp dụng Skeleton nhất quán trên toàn bộ FE**: mọi trang data-driven, danh sách, preview trang chủ, form phụ thuộc dữ liệu remote đều cần skeleton/loading state thay vì text placeholder hoặc layout nhảy.
- [ ] **Bỏ Zustand khỏi dependencies** nếu không dùng — hoặc tạo store thực sự (vd: UI state của mobile menu).
- [ ] **Debounce ô tìm kiếm** (300ms) ở Members và Teachers để tránh re-render mỗi keystroke khi dataset lớn.
- [ ] **Lazy loading ảnh** trong Gallery — thêm `loading="lazy"` trên các `<img>` không ở fold đầu tiên.
- [ ] **Thêm `.env.example`** để người deploy sau biết cần set `VITE_POCKETBASE_URL`.
- [ ] **Consolidate stats queries** trong `useStats.ts` — hiện gọi 5 API riêng lẻ, có thể gộp lại.
