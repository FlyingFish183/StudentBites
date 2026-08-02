# 01 · Bắt đầu

> Chạy giao diện cùng backend, có dữ liệu thật để nhìn thấy sản phẩm hoạt
> động. Khoảng 5 phút nếu backend đã sẵn sàng.

**Loại tài liệu:** Tutorial.

---

## Cần có trước

Giao diện gọi API qua `/api/*`, không có backend thì mọi màn hình sẽ đứng ở
khung chờ hoặc bị đẩy về trang đăng nhập.

**Dựng backend trước** theo
[Backend/docs/01 · Bắt đầu](../../../Backend/docs/01-bat-dau.md) — cần
PostgreSQL trong Docker, migrate, seed, rồi API chạy ở cổng 3001.

Kiểm tra nhanh:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/auth/me
# 401 là đúng — nghĩa là API sống và đang đòi đăng nhập
```

---

## Chạy

```bash
cd Frontend/studentbite
npm install
npm run dev        # http://localhost:3000
```

Lần chạy đầu, Next.js sẽ tải hai bộ chữ **Anton** và **Be Vietnam Pro** từ
Google Fonts rồi tự lưu vào bản build — **cần mạng ở lần build đầu tiên**,
sau đó thì không.

---

## Cấu hình

Chỉ có một tuỳ chọn, nằm trong
[`next.config.ts`](../next.config.ts):

```ts
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";
```

Toàn bộ `/api/:path*` được `rewrites` chuyển tiếp sang đó. Nhờ vậy:

- Trình duyệt luôn thấy **cùng một origin** → không cần CORS.
- Cookie `httpOnly` do backend đặt đi kèm request một cách tự nhiên.

Backend chạy ở cổng khác thì đặt biến môi trường:

```bash
BACKEND_URL=http://localhost:4001 npm run dev
```

---

## Đi hết một vòng sản phẩm

1. Mở <http://localhost:3000> — chưa đăng nhập sẽ bị đẩy sang `/login`.
2. Bấm **Đăng ký**, tạo tài khoản.
3. Wizard **onboarding** 3 bước: thể trạng → mục tiêu → ngân sách. Bước cuối
   hiện luôn số tiền tương đương mỗi ngày.
4. Vào **Thực đơn**, bấm *Tạo cả tuần*.
5. Về **Trang chủ**, bấm *Đánh dấu* ở một bữa — số liệu dinh dưỡng và ngân
   sách đổi **ngay lập tức**, không đợi mạng
   ([06 · Dữ liệu & trạng thái](./06-du-lieu-va-trang-thai.md)).
6. Vào **Lịch sử** xem nhật ký và biểu đồ chi tiêu.
7. Vào **Đi chợ**, cho phép định vị hoặc gõ địa chỉ, rồi xem bảng so giá.

Đi hết 7 bước mà không lỗi thì cả hai phía đã nối đúng.

---

## Bảng lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Dev server, cổng 3000 |
| `npm run build` | Build sản xuất (chạy TypeScript check bên trong) |
| `npm start` | Chạy bản đã build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Chỉ kiểm tra kiểu |

---

## Gỡ rối nhanh

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Đứng ở màn "Đang dọn bàn" | Backend chưa chạy hoặc sai cổng | Kiểm tra `curl` như trên; xem `BACKEND_URL` |
| Đăng nhập xong lại bị đẩy về `/login` | Cookie không được đặt | Phải vào qua `localhost:3000`, không phải `127.0.0.1:3000` — cookie neo theo host |
| Trang chủ chờ mãi sau khi vừa đăng ký | `GET /api/profile` trả 404 | Lỗi đã biết, xem [09 · Vấn đề đã biết](./09-van-de-da-biet.md) |
| Bản đồ trắng ở màn Đi chợ | Leaflet chưa nạp CSS hoặc bị chặn mạng | CSS import trong `components/StoreMap.tsx`; kiểm tra tab Network |
| Chữ hiện bằng font hệ thống | Lần build đầu không có mạng | Chạy lại `npm run dev` khi đã có mạng |
| Biểu đồ trống ở tab Chi tiêu | Chưa đánh dấu bữa nào | Đánh dấu vài bữa rồi quay lại |
