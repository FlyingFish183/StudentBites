# Architecture Decision Records — Frontend

> Mỗi file ghi lại **một** quyết định: bối cảnh lúc quyết, các lựa chọn đã cân
> nhắc, và cái giá phải trả. Mục đích để người sau hiểu vì sao — và biết khi
> nào nên đảo ngược.

Cùng định dạng [MADR](https://adr.github.io/madr/) rút gọn với
[ADR phía Backend](../../../../Backend/docs/adr/README.md).

## Danh sách

| # | Quyết định | Trạng thái | Ngày |
|---|---|---|---|
| [0001](./0001-huong-nhan-dien-bang-hieu.md) | Chọn hướng nhận diện "Bảng Hiệu", cam kết một tông màu | Đã áp dụng | 2026-08 |
| [0002](./0002-tanstack-query-lam-nguon-su-that.md) | TanStack Query là nguồn sự thật, không thêm store toàn cục | Đã áp dụng | 2026-07 |
| [0003](./0003-khung-app-doi-theo-man-hinh.md) | Bề rộng do từng nhóm route quyết, không khoá ở layout gốc | Đã áp dụng | 2026-08 |

## Mẫu

```markdown
# ADR-000X · <Quyết định, viết ở thể khẳng định>

**Trạng thái:** Đề xuất | Đã áp dụng | Đã thay thế bởi ADR-000Y
**Ngày:** YYYY-MM

## Bối cảnh
## Quyết định
## Các lựa chọn đã cân nhắc
## Hệ quả
```
