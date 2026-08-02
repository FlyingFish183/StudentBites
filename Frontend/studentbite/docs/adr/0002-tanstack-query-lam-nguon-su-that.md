# ADR-0002 · TanStack Query là nguồn sự thật cho dữ liệu máy chủ

**Trạng thái:** Đã áp dụng
**Ngày:** 2026-07

## Bối cảnh

Gần như toàn bộ trạng thái của app là **dữ liệu máy chủ**: hồ sơ, thực đơn,
nhật ký, thống kê, giá. Dữ liệu giao diện thuần tuý chỉ có vài thứ nhỏ — ngày
đang chọn, tab đang mở, bán kính bản đồ.

Cùng một dữ liệu xuất hiện ở nhiều màn: thực đơn hôm nay hiện ở cả Trang chủ
và màn Thực đơn. Tạo thực đơn ở màn này thì màn kia phải mới theo.

## Quyết định

Dùng **TanStack Query 5** làm nguồn sự thật duy nhất cho dữ liệu máy chủ.
Không thêm Redux, Zustand hay Context nào cho dữ liệu. `useState` chỉ giữ
trạng thái giao diện thuần tuý.

Kèm ba quy ước:

1. **Không sao dữ liệu máy chủ vào `useState`** — làm vậy là tạo bản sao thứ
   hai chắc chắn sẽ lệch.
2. **Khoá cache theo mẫu `[tên nguồn, ...tham số]`** —
   [06 · Dữ liệu & trạng thái](../06-du-lieu-va-trang-thai.md) có bảng đầy đủ.
3. **Chỉ `lib/api.ts` được gọi `fetch`.**

## Các lựa chọn đã cân nhắc

| Lựa chọn | Ưu | Nhược | Vì sao loại |
|---|---|---|---|
| `useEffect` + `useState` tự viết | Không thêm thư viện | Phải tự làm cache, dedupe, trạng thái tải/lỗi, đồng bộ giữa các màn | Viết lại một thư viện, kém hơn |
| Redux Toolkit + RTK Query | Có sẵn store cho cả hai loại trạng thái | Nhiều mã khuôn mẫu; app này gần như không có trạng thái toàn cục phía client | Giải bài toán mình không có |
| Server Components + `fetch` của Next | Ít JS gửi xuống trình duyệt | App tương tác mạnh, gần như mọi màn cần state; mất cache phía client | Không hợp bản chất ứng dụng |
| TanStack Query *(đã chọn)* | Cache, dedupe, invalidate, cập nhật lạc quan có sẵn | Thêm một khái niệm phải học: khoá cache | — |

## Hệ quả

**Được:**
- Chuyển màn trong 30 giây (`staleTime`) không gọi lại mạng.
- `invalidateQueries` sau khi ghi làm mọi màn liên quan tự mới — Trang chủ và
  Thực đơn dùng chung khoá `["plan", date]` nên tự đồng bộ.
- Cập nhật lạc quan cho nút "Đánh dấu" là cơ chế có sẵn, kèm đường hoàn tác.
- Mỗi query tự mang `isPending` / `isError`, nên mọi màn đều có trạng thái tải
  và lỗi mà không phải tự dựng.

**Mất:**
- **Khoá cache là hợp đồng ngầm.** Gõ sai khoá trong `invalidateQueries` thì
  giao diện không cập nhật mà **không có lỗi nào báo** — TypeScript không bắt
  được. Vì thế mới cần bảng khoá trong tài liệu 06.
- Người mới phải hiểu khái niệm stale/invalidate trước khi sửa được luồng dữ
  liệu.
- `staleTime: 30_000` nghĩa là dữ liệu có thể cũ tới 30 giây. Chấp nhận được
  với app một người dùng một tài khoản; sẽ phải xem lại nếu có tính năng nhiều
  người cùng sửa.

**Xem lại quyết định khi:** xuất hiện trạng thái toàn cục phía client thật sự
(giỏ hàng nhiều bước, soạn thảo nhiều màn), hoặc khi cần dữ liệu thời gian
thực — lúc đó cân nhắc thêm một lớp đồng bộ chứ không thay thế Query.
