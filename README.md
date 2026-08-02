# StudentBites

> Ăn đủ chất, vừa túi tiền sinh viên.

Ứng dụng web giúp sinh viên lên thực đơn **đủ đạm trong hạn mức chi tiêu**,
theo dõi đã ăn gì tiêu bao nhiêu, và tìm nơi mua nguyên liệu rẻ nhất quanh
chỗ ở.

---

## Tài liệu

| Bộ | Nội dung |
|---|---|
| **[Backend](./Backend/docs/README.md)** | Kiến trúc, mô hình dữ liệu, API, thuật toán chọn thực đơn, crawler giá |
| **[Frontend](./Frontend/studentbite/docs/README.md)** | Kiến trúc, hệ thống thiết kế "Bảng Hiệu", thư viện component, từng màn hình |

Cả hai bộ dùng chung một chuẩn: [Diátaxis](https://diataxis.fr/) để phân loại
tài liệu, [C4 model](https://c4model.com/) cho sơ đồ kiến trúc, và ADR cho
quyết định kiến trúc. Sơ đồ vẽ bằng Mermaid, nhúng thẳng vào Markdown.

**Người mới bắt đầu từ đây:**
[Backend/docs/01 · Bắt đầu](./Backend/docs/01-bat-dau.md) → dựng database và
API trước, rồi tới
[Frontend/docs/01 · Bắt đầu](./Frontend/studentbite/docs/01-bat-dau.md).

---

## Cấu trúc kho mã

```
Backend/                  Express 5 + TypeScript + Prisma + PostgreSQL
  src/routes/               tầng HTTP
  src/services/             nghiệp vụ (gồm thuật toán chọn thực đơn)
  src/crawlers/             crawl giá từ 3 website bán lẻ
  prisma/                   schema, migration, seed
  docs/                     👉 tài liệu Backend

Frontend/studentbite/     Next.js 16 + React 19 + Tailwind 4
  app/                      route (App Router)
  components/ui/            thư viện component dùng chung
  lib/                      gọi API, kiểu dữ liệu, hàm định dạng
  docs/                     👉 tài liệu Frontend
```

---

## Chạy nhanh

```bash
# 1. Backend — cần Docker đang chạy
cd Backend
npm install
npm run db:up
export DATABASE_URL="postgresql://studentbites:studentbites@localhost:5434/studentbites"
npx prisma migrate deploy && npm run db:seed
npm run dev:basic          # http://localhost:3001

# 2. Frontend — cửa sổ terminal khác
cd Frontend/studentbite
npm install
npm run dev                # http://localhost:3000
```

Mở <http://localhost:3000>, đăng ký một tài khoản rồi đi hết wizard onboarding.

---

## Năm nhóm tính năng

| Nhóm | Việc |
|---|---|
| Hồ sơ & ngân sách | Từ thể trạng và tiền chu cấp, tính ra mục tiêu dinh dưỡng và hạn mức mỗi ngày/mỗi bữa |
| Gợi ý thực đơn | Tự chọn 4 bữa đủ đạm mà không vượt hạn mức; đổi được từng món |
| Chi phí & lịch sử | Ghi nhận bữa đã ăn, đối chiếu thực tế với kế hoạch theo ngày/tuần/tháng |
| Dinh dưỡng | Theo dõi protein/carb/fat/calo so với mục tiêu, nhắc khi thiếu đạm |
| Bản đồ & so giá | Tìm chợ, siêu thị quanh chỗ ở; so giá nguyên liệu giữa các nguồn |

---

## Ngăn xếp công nghệ

**Backend** — Node.js · Express 5 · TypeScript · Prisma · PostgreSQL 16 ·
Vitest · axios + cheerio · node-cron

**Frontend** — Next.js 16 · React 19 · Tailwind CSS 4 · TanStack Query 5 ·
Recharts 3 · Leaflet

**Dịch vụ ngoài** — OpenStreetMap (Overpass, Nominatim)
