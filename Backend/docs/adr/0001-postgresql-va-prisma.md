# ADR-0001 · Dùng PostgreSQL + Prisma thay cho ORM giả bằng file JSON

**Trạng thái:** Đã áp dụng
**Ngày:** 2026-07

## Bối cảnh

Dự án khởi đi từ một template Express có sẵn `MockOrm` — một "cơ sở dữ liệu"
đọc ghi vào file JSON trên đĩa. Template đó phù hợp để demo CRUD, nhưng mô
hình dữ liệu thật của StudentBites có 10 bảng với quan hệ nhiều-nhiều
(`Dish ↔ Ingredient`), khoá duy nhất phức hợp (`MealPlan` theo `userId + date`),
và truy vấn lọc theo khoảng ngày.

## Quyết định

Dùng **PostgreSQL 16** chạy trong Docker, truy cập qua **Prisma**. Toàn bộ
schema khai báo trong [`prisma/schema.prisma`](../../prisma/schema.prisma),
biến đổi schema quản lý bằng migration đã commit.

## Các lựa chọn đã cân nhắc

| Lựa chọn | Ưu | Nhược | Vì sao loại |
|---|---|---|---|
| Giữ `MockOrm` | Không phải cài gì | Không có quan hệ, không có ràng buộc, không giao dịch, hỏng khi ghi đồng thời | Không mô tả nổi mô hình dữ liệu thật |
| SQLite + Prisma | Không cần Docker | Không có kiểu mảng, `enum` yếu, khác môi trường triển khai | `Ingredient.keywords` và `Dish.mealTypes` cần kiểu mảng |
| MongoDB + Mongoose | Schema linh hoạt | Dữ liệu ở đây quan hệ rõ ràng; join thủ công | Cưỡng ép mô hình quan hệ vào tài liệu |
| PostgreSQL + TypeORM | Phổ biến | Kiểu suy ra yếu hơn, migration hay lệch | Prisma cho kiểu chặt hơn từ schema |

## Hệ quả

**Được:**
- Kiểu TypeScript sinh thẳng từ schema — sửa bảng mà quên sửa mã là lỗi biên dịch.
- Ràng buộc đặt ở đúng chỗ: `@@unique([userId, date])` khiến "một người một
  ngày một thực đơn" là bất biến của dữ liệu, không phải quy ước trong mã.
- Kiểu mảng gốc của PostgreSQL cho `keywords` và `mealTypes`.
- Migration nằm trong Git nên môi trường nào cũng dựng lại được y hệt.

**Mất:**
- Người mới phải cài Docker mới chạy được — xem
  [01 · Bắt đầu](../01-bat-dau.md).
- Prisma CLI đọc `.env` ở gốc chứ không đọc `config/.env.development`, nên
  lệnh migrate cần xuất `DATABASE_URL` ra shell. Đây là điểm vấp thường gặp.
- Còn lại cả cụm mã chết của `MockOrm` chưa dọn — xem
  [08 · Vấn đề đã biết](../08-van-de-da-biet.md).

**Xem lại quyết định khi:** cần đọc/ghi ở quy mô lớn tới mức Prisma trở thành
nút thắt, hoặc khi cần truy vấn địa lý thật sự (lúc đó bật PostGIS thay vì
tính haversine trong Node như hiện nay).
