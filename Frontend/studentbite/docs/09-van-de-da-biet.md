# 09 · Vấn đề đã biết

> Giới hạn và nợ kỹ thuật phía giao diện, kèm mức ưu tiên và hướng xử lý.

**Loại tài liệu:** Reference. **Rà soát lần cuối:** 2026-08-02.

| Mức | Nghĩa |
|---|---|
| **P1** | Người dùng thật gặp phải |
| **P2** | Rủi ro hoặc nợ kỹ thuật |
| **P3** | Cải thiện, không ảnh hưởng hành vi |

---

## P1 · Trang chủ treo khi chưa có hồ sơ

Người dùng vừa đăng ký, chưa qua onboarding, mà mở thẳng `/` thì màn hình
đứng ở khung chờ mãi mãi.

Trang chủ giả định `GET /api/profile` trả `{ profile: null }`, nhưng backend
trả **404**. Query rơi vào trạng thái lỗi, `hasProfile` không bao giờ bật, ba
query còn lại bị `enabled: false` nên chỉ hiện `Skeleton`.

Ít gặp vì luồng thường là đăng ký → chuyển thẳng sang `/onboarding`.

**Hướng sửa.** Sửa ở backend là đúng chỗ nhất
([Backend/docs/08](../../../Backend/docs/08-van-de-da-biet.md)). Nếu chưa sửa
được backend thì phía giao diện bắt riêng `ApiError` có `status === 404` và
coi đó là "chưa có hồ sơ".

---

## P1 · Không có ranh giới lỗi

Component ném lỗi lúc render sẽ làm trắng cả trang, không có gì để người dùng
làm tiếp. Chưa có `error.tsx` cho App Router.

**Hướng sửa.** Thêm `app/error.tsx` và `app/(main)/error.tsx` với nút "Thử
lại" — App Router hỗ trợ sẵn, chỉ cần tạo file.

---

## P2 · Kiểu dữ liệu API đồng bộ thủ công

[`lib/types.ts`](../lib/types.ts) chép tay hình dạng response của backend.
Backend đổi tên trường mà quên sửa bên này thì TypeScript **không** báo lỗi —
sai lệch chỉ lộ ra lúc chạy.

**Hướng sửa.** Sinh kiểu từ một nguồn duy nhất: backend xuất OpenAPI rồi dùng
`openapi-typescript`, hoặc đưa file kiểu dùng chung vào một package nội bộ.

---

## P2 · Chưa có test tự động

Chỉ có lint, kiểm tra kiểu và kiểm tra bằng mắt. Đổi `Meter` hay `Button` mà
làm hỏng trạng thái nào đó thì không có gì bắt được.

Thứ tự nên bổ sung ghi ở
[08 · Quy ước & kiểm thử](./08-quy-uoc-va-kiem-thu.md#hiện-có).

---

## P2 · Màn Đi chợ gọi lại mạng nhiều hơn cần thiết

Mỗi lần đổi bán kính là một lượt gọi `/stores/nearby` mới vì bán kính nằm
trong `queryKey`. Đúng về mặt cache, nhưng bấm nhanh 1km → 2km → 5km là ba
lượt gọi Overpass — dịch vụ này có giới hạn tần suất thật.

**Hướng sửa.** Chống dội (debounce) khi đổi bán kính, hoặc luôn lấy 5km rồi
lọc phía client.

---

## P2 · Nút "Đánh dấu" khoá theo cả danh sách

Trong lúc một mutation đang chạy, `eatMutation.isPending` khoá nút của **mọi**
bữa chứ không riêng bữa đang gửi. Bấm nhanh hai bữa liền thì bữa thứ hai bị
chặn cho tới khi bữa đầu xong.

Màn Thực đơn đã làm đúng cách này với nút Đổi món: so
`swapMutation.variables` với `item.id` để chỉ khoá đúng thẻ đang xử lý. Trang
chủ nên làm y vậy.

---

## P2 · Không có thông báo nổi (toast)

Thao tác thành công không có xác nhận, trừ việc giao diện tự đổi. Lỗi hiện
bằng `Banner` ngay tại chỗ — ổn cho lỗi cục bộ, nhưng lỗi ở cuối trang dài có
thể bị bỏ sót.

**Hướng sửa.** Thêm một `ToastProvider` nhỏ. Nếu làm, đặt ở góc **trên** để
không đè lên TabBar trên điện thoại.

---

## P3 · Bốn file SVG mặc định của Next còn trong `public/`

`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` là tài nguyên
mẫu, không màn nào dùng. Xoá được ngay.

---

## P3 · Biểu đồ không có animation

Đã tắt `isAnimationActive` để biểu đồ vẽ xong ngay từ khung hình đầu. Quyết
định này bắt nguồn từ một chẩn đoán sai: animation dựng cột không tiến dưới
Chrome headless nên ảnh chụp bắt được lúc cột còn cao 0, và ban đầu bị nhầm
là lỗi render. Trên trình duyệt thật, animation vẫn chạy bình thường.

Giữ tắt là lựa chọn có ý thức — biểu đồ này không cần animation, và tắt đi thì
ảnh chụp tự động luôn phản ánh đúng cái người dùng thấy. Ghi lại ở đây để
người sau không tưởng là bỏ sót.

---

## P3 · Chưa có PWA

Không có manifest, không có service worker, không cài được lên màn hình chính.
Với một app dùng hằng ngày trên điện thoại thì đây là thứ nên có.
