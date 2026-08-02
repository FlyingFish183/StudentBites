# ADR-0002 · Đặt JWT trong cookie `httpOnly` thay vì `localStorage`

**Trạng thái:** Đã áp dụng
**Ngày:** 2026-07

## Bối cảnh

Cần giữ phiên đăng nhập cho một web app gọi API cùng máy chủ (Next.js proxy
`/api` sang Express). Người dùng mong muốn không phải đăng nhập lại mỗi lần
mở app.

## Quyết định

Ký JWT hạn **30 ngày**, đặt vào cookie `sb_token` với `httpOnly: true`,
`sameSite: 'lax'`, `secure` theo biến môi trường `COOKIE_SECURE`.
Middleware [`requireAuth`](../../src/routes/common/auth.ts) đọc cookie, xác
minh chữ ký, gắn `userId` vào `res.locals`.

## Các lựa chọn đã cân nhắc

| Lựa chọn | Ưu | Nhược | Vì sao loại |
|---|---|---|---|
| JWT trong `localStorage` | Dễ đính kèm header, không vướng CORS | **JavaScript đọc được** — một lỗ XSS là mất token | Rủi ro không đáng đánh đổi |
| Cookie `httpOnly` *(đã chọn)* | JS không đọc được; trình duyệt tự gửi | Phải nghĩ tới CSRF; cần cùng origin | — |
| Session lưu server (Redis) | Thu hồi được ngay lập tức | Thêm một hạ tầng phải vận hành | Quá mức cho một dự án học tập |

## Hệ quả

**Được:**
- Mã chèn qua XSS không lấy được token.
- Frontend không phải quản lý token: chỉ cần `credentials: "include"` trong
  [`lib/api.ts`](../../../Frontend/studentbite/lib/api.ts).
- Nhờ Next.js `rewrites`, trình duyệt thấy cùng một origin nên không cần CORS
  và cookie đi kèm tự nhiên.

**Mất:**
- **Không thu hồi được token trước hạn.** Đăng xuất chỉ xoá cookie ở phía
  trình duyệt; token đã ký vẫn hợp lệ 30 ngày nếu ai đó sao chép được. Muốn
  thu hồi thật thì phải có danh sách chặn ở server.
- 30 ngày là dài. Chọn vậy để đỡ phiền người dùng, đổi lấy rủi ro cao hơn.
- `sameSite: 'lax'` chặn được phần lớn CSRF cho request `POST` chéo site,
  nhưng **chưa có CSRF token**. Chấp nhận được khi frontend và backend cùng
  origin; sẽ phải bổ sung nếu tách domain.
- `secure` phụ thuộc `COOKIE_SECURE` — triển khai thật mà quên bật cờ này là
  gửi token qua HTTP trần.

**Xem lại quyết định khi:** cần đăng xuất mọi thiết bị, cần khoá tài khoản
tức thì, hoặc khi frontend chuyển sang domain khác backend.
