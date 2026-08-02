# Architecture Decision Records

> Mỗi file ghi lại **một** quyết định kiến trúc: bối cảnh lúc quyết, các lựa
> chọn đã cân nhắc, và cái giá phải trả. Mục đích không phải khoe quyết định
> đúng, mà để người sau hiểu vì sao — và biết khi nào nên đảo ngược.

Định dạng theo [MADR](https://adr.github.io/madr/) rút gọn.

## Danh sách

| # | Quyết định | Trạng thái | Ngày |
|---|---|---|---|
| [0001](./0001-postgresql-va-prisma.md) | PostgreSQL + Prisma thay cho ORM giả bằng file JSON | Đã áp dụng | 2026-07 |
| [0002](./0002-jwt-trong-cookie-httponly.md) | JWT đặt trong cookie `httpOnly` thay vì `localStorage` | Đã áp dụng | 2026-07 |
| [0003](./0003-osm-thay-vi-google-maps.md) | OpenStreetMap (Overpass + Nominatim) thay vì Google Maps | Đã áp dụng | 2026-07 |
| [0004](./0004-tach-thuat-toan-khoi-service.md) | Tách thuật toán chọn thực đơn thành hàm thuần | Đã áp dụng | 2026-07 |

## Khi nào viết ADR mới

Viết khi quyết định thoả **cả hai**: khó đảo ngược, và người sau sẽ thắc mắc
"sao lại làm thế này". Chọn thư viện tiện ích nhỏ thì không cần; đổi cách lưu
phiên đăng nhập thì cần.

## Mẫu

```markdown
# ADR-000X · <Quyết định, viết ở thể khẳng định>

**Trạng thái:** Đề xuất | Đã áp dụng | Đã thay thế bởi ADR-000Y
**Ngày:** YYYY-MM

## Bối cảnh
Tình huống lúc đó, ràng buộc gì đang có.

## Quyết định
Chọn gì.

## Các lựa chọn đã cân nhắc
| Lựa chọn | Ưu | Nhược | Vì sao loại |

## Hệ quả
Được gì, mất gì, và điều kiện nào thì nên xem lại quyết định này.
```
