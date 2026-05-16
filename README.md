# Giao Lộ Khối 9 Reunion

Website họp lớp cho "Giao Lộ Khối 9", gồm trang giới thiệu, danh sách bạn bè, Thầy Cô, album kỷ niệm, lưu bút, tạo avatar và form RSVP. Backend dùng PocketBase để quản lý dữ liệu, file upload, migration và hook đồng bộ RSVP sang thành viên. Frontend React có thể build nhúng vào binary Go hoặc deploy tách riêng như một Vite SPA.

## Tech Stack

- Backend: Go, PocketBase, PocketBase migrations, custom record hooks.
- Frontend: Vite, React, TypeScript, TanStack Router, TanStack Query.
- UI: Tailwind CSS, shadcn-style primitives, Radix UI, lucide-react.
- Form và validation: react-hook-form, zod.
- Data client: PocketBase JS SDK.
- Build/deploy: Docker multi-stage build, GitHub Actions CI, static frontend nhúng bằng Go `embed`.

## Cấu Trúc Dự Án

```txt
cmd/server/        Entrypoint Go/PocketBase server
migrations/        Schema và data migrations của PocketBase
web/               Frontend React
web/src/routes/    Routes theo file của TanStack Router
web/src/hooks/     Hooks dùng TanStack Query để gọi dữ liệu
web/src/types/     Type domain dùng chung phía frontend
web/dist.go        Nhúng web/dist vào binary Go
pb_data/           Dữ liệu PocketBase local, không commit
```

## Biến Môi Trường

Frontend:

```sh
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_REUNION_ACCESS_CODE=31/05
```

Backend:

```sh
REUNION_ACCESS_CODE=31/05
```

Nếu không set `VITE_POCKETBASE_URL`, frontend mặc định gọi `http://127.0.0.1:8090`.

## Chạy Local

Cài dependencies frontend:

```sh
cd web
pnpm install
```

Chạy PocketBase backend:

```sh
go run ./cmd/server serve --http=127.0.0.1:8090
```

Chạy frontend dev server:

```sh
cd web
pnpm run dev
```

Khi chạy frontend và backend tách riêng ở local, giữ `VITE_POCKETBASE_URL=http://127.0.0.1:8090` để Vite app gọi đúng PocketBase local.

## Kiểm Tra

Frontend:

```sh
cd web
pnpm run lint
pnpm run build
```

Backend:

```sh
go test ./...
go build -trimpath -o server ./cmd/server
```

CI hiện chạy lint/build frontend và build backend. Docker workflow dùng npm vì repo có `web/package-lock.json`.

## Database Và Nội Dung

PocketBase collections được quản lý bằng Go migrations trong `migrations/`. Khi đổi schema, tạo migration mới thay vì sửa migration đã apply.

Quy tắc nội dung quan trọng:

- Nội dung người dùng gửi công khai thường cần duyệt trước khi hiển thị.
- `feelings` gửi từ public sẽ bị ép `is_approved=false` và `is_public=true`.
- `rsvps` gửi từ public được normalize/dedupe contact và mặc định `is_approved=false`.
- RSVP đã duyệt sẽ đồng bộ sang collection `members`, gồm relation lớp và ảnh thumb.
- Record trong `gallery` có field `show_in_hero`; chỉ ảnh public có bật field này mới được dùng làm ảnh nền hero ở trang chủ.

Không sửa hoặc xoá `pb_data/` nếu không chủ động reset dữ liệu local.

## Build Nhúng Frontend Vào Backend

Kiểu deploy này để Go/PocketBase server phục vụ luôn React build. Đây là topology đơn giản nhất cho production.

```sh
cd web
pnpm run build

cd ..
go build -trimpath -o server ./cmd/server
./server migrate up
./server serve --http=0.0.0.0:8090
```

Cách hoạt động:

- `web/dist.go` nhúng `web/dist` bằng `go:embed all:dist`.
- `cmd/server/main.go` serve SPA đã nhúng cho các route không phải API.
- PocketBase APIs và uploaded files chạy cùng origin với website.

Dùng kiểu này khi app và API cùng một domain, ví dụ `https://khoa91yendong.io.vn`.

## Deploy Bằng Docker

`Dockerfile` hiện build frontend trước, nhúng vào Go server, rồi chạy PocketBase ở port `8090`.

```sh
docker build \
  --build-arg VITE_POCKETBASE_URL=https://khoa91yendong.io.vn \
  -t hoplop .

docker run -d \
  --name hoplop \
  -p 8090:8090 \
  -e REUNION_ACCESS_CODE=31/05 \
  -v hoplop_pb_data:/app/pb_data \
  hoplop
```

Entrypoint của container chạy:

```sh
./server migrate up
./server serve --http=0.0.0.0:8090
```

Cần persist `/app/pb_data` vì thư mục này chứa SQLite database và uploaded files của PocketBase.

## Deploy Frontend Và Backend Tách Riêng

Có thể deploy PocketBase và Vite frontend thành hai service riêng.

Backend service:

```sh
go build -trimpath -o server ./cmd/server
./server migrate up
./server serve --http=0.0.0.0:8090
```

Frontend static service:

```sh
cd web
VITE_POCKETBASE_URL=https://api.example.com pnpm run build
```

Deploy thư mục `web/dist` lên static host như Nginx, Cloudflare Pages, Netlify hoặc Vercel.

Yêu cầu khi deploy tách riêng:

- `VITE_POCKETBASE_URL` phải trỏ tới backend public URL tại thời điểm build.
- Cấu hình CORS / allowed origins trong PocketBase nếu frontend và backend khác origin.
- Static hosting phải fallback mọi frontend route về `index.html`.
- File URLs được tạo từ `VITE_POCKETBASE_URL`, nên URL này phải là origin public đang serve PocketBase `/api/files`.

## Lệnh Hữu Ích

```sh
# Backend
go run ./cmd/server serve --http=127.0.0.1:8090
go test ./...
go build -trimpath -o server ./cmd/server

# Frontend
cd web
pnpm run dev
pnpm run lint
pnpm run build
pnpm run preview
```

## Ghi Chú Vận Hành

- PocketBase admin UI có sẵn từ backend server.
- Backup `pb_data/` trước khi migrate hoặc deploy.
- Set `REUNION_ACCESS_CODE` và `VITE_REUNION_ACCESS_CODE` nhất quán nếu đổi mã vào trang.
- Khi dùng deploy nhúng, build frontend trước rồi mới build Go binary.
