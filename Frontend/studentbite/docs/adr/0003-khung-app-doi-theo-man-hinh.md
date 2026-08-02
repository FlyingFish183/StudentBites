# ADR-0003 · Bề rộng do từng nhóm route quyết, không khoá ở layout gốc

**Trạng thái:** Đã áp dụng
**Ngày:** 2026-08

## Bối cảnh

App được dựng mobile-first. Layout gốc `app/layout.tsx` khoá cứng
`max-w-[480px]` cho toàn bộ nội dung — hợp lý khi chỉ nhắm điện thoại.

Khi cần hỗ trợ desktop, ràng buộc đó thành bức tường: **không màn nào có thể
rộng hơn 480px dù muốn**, vì layout gốc bọc ngoài tất cả. Kết quả là desktop
chỉ là bản mobile kéo giãn, một dải hẹp giữa hai khoảng trống mênh mông.

## Quyết định

Gỡ ràng buộc bề rộng khỏi layout gốc. Layout gốc chỉ còn lo font, metadata và
`Providers`. Mỗi nhóm route tự quyết bề rộng và khung của mình:

| Nhóm | Bề rộng | Điều hướng |
|---|---|---|
| `(main)/` | `max-w-120 → md:max-w-215 → lg:max-w-295` | `SideNav` từ `lg`, `TabBar` dưới `lg` |
| Đăng nhập / Đăng ký (`AuthShell`) | Một cột, chia đôi màn từ `lg` | — |
| Onboarding | `max-w-140 → lg:max-w-170` | — |

`SideNav` và `TabBar` đọc chung [`lib/nav.ts`](../../lib/nav.ts) nên không bao
giờ lệch nhau.

## Các lựa chọn đã cân nhắc

| Lựa chọn | Ưu | Nhược | Vì sao loại |
|---|---|---|---|
| Giữ 480px, chỉ phóng to chữ trên desktop | Đổi ít nhất | Vẫn là app điện thoại trên màn hình lớn; lãng phí không gian | Không giải quyết vấn đề |
| Nới `max-width` ở layout gốc theo điểm ngắt | Vẫn tập trung một chỗ | Màn đăng nhập muốn chia đôi cả màn hình, không nằm vừa một cột nào | Không đủ linh hoạt |
| Mỗi nhóm route tự quyết *(đã chọn)* | Mỗi khung hợp với nội dung của nó | Bề rộng nằm ở 3 chỗ thay vì 1 | — |
| Hai bản riêng cho mobile và desktop | Tối ưu từng bản | Nhân đôi mã và nhân đôi lỗi | Không đáng với quy mô này |

## Hệ quả

**Được:**
- Desktop thành bố cục thật: Trang chủ 3 cột, Thực đơn lưới 2 cột, Lịch sử
  lịch trái–chi tiết phải, Đi chợ bản đồ trái–so giá phải.
- Màn đăng nhập chia đôi được cả màn hình — điều không thể làm khi bị bọc
  trong cột 480px.
- Thanh bên desktop giữ luôn khối tài khoản, nhờ đó Trang chủ bỏ được hai nút
  trùng lặp ở góc.

**Mất:**
- Bề rộng nằm ở ba nơi. Ai thêm nhóm route mới phải **nhớ tự đặt bề rộng** —
  quên thì nội dung trải hết màn hình. Đây là cái giá trực tiếp của quyết định
  này, ghi ra để người sau không vấp.
- `Board` phải bỏ lề ngang của riêng nó và giao lề cho khung trang, nếu không
  sẽ thụt hai lần khi nằm trong lưới desktop. Quy ước này dễ quên.
- Ba mốc phải kiểm tra thay vì một.

**Xem lại quyết định khi:** số nhóm route tăng tới mức việc lặp lại cấu hình
bề rộng thành phiền — khi đó rút ra một component `<PageContainer>` dùng chung
thay vì quay lại khoá ở layout gốc.
