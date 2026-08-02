# 01 · Bắt đầu

> Đưa bạn từ một máy chưa có gì đến chỗ gọi được API thật, với dữ liệu mẫu
> đủ để nhìn thấy sản phẩm hoạt động. Mất khoảng 10 phút.

**Loại tài liệu:** Tutorial — làm theo tuần tự, không cần hiểu tại sao. Phần
"tại sao" nằm ở [02 · Kiến trúc](./02-kien-truc.md).

---

## Cần có sẵn

| Công cụ | Bản | Kiểm tra |
|---|---|---|
| Node.js | ≥ 20 | `node -v` |
| npm | ≥ 10 | `npm -v` |
| Docker Desktop | bất kỳ, đang chạy | `docker info` |

Không cần cài PostgreSQL — Docker lo phần đó.

---

## Các bước

### 1. Cài phụ thuộc

```bash
cd Backend
npm install
```

### 2. Kiểm tra biến môi trường

Ba file cấu hình đã có sẵn trong `config/` (đây là **dotfile**, `ls` thường
không hiện — dùng `ls -a`):

| File | Dùng khi |
|---|---|
| `.env.development` | `npm run dev` |
| `.env.test` | `npm test` (cổng 4000, DB riêng) |
| `.env.production` | `npm start` sau khi build |

Mở `config/.env.development` và xác nhận `DATABASE_URL` trỏ tới cổng **5434** —
đây là cổng `docker-compose.yml` ánh xạ ra ngoài, cố tình lệch 5432 để không
đụng PostgreSQL sẵn có trên máy.

> ⚠️ Đừng ghi đè các file này. Chúng đã được commit và chứa cả cấu hình
> `JET_LOGGER_*` mà server cần.

### 3. Dựng cơ sở dữ liệu

```bash
npm run db:up          # chạy PostgreSQL 16 trong Docker
npx prisma migrate deploy   # tạo bảng theo migration đã commit
npm run db:seed        # nạp nguyên liệu, món ăn, giá tham khảo
```

Seed xong sẽ in ra dòng xác nhận:

```
Seed done: { ingredients: 28, stores: 3, prices: 84, dishes: 26 }
```

Nếu `prisma` báo không đọc được `DATABASE_URL`, xuất biến ra shell rồi chạy
lại — Prisma CLI đọc `.env` ở gốc chứ không đọc `config/.env.development`:

```bash
export DATABASE_URL="postgresql://studentbites:studentbites@localhost:5434/studentbites"
```

### 4. Chạy server

```bash
npm run dev:basic      # chỉ API, cổng 3001
# hoặc
npm run dev            # API + browser-sync tự nạp lại
```

Server sẵn sàng khi log hiện:

```
Express server started on port: 3001
[crawler] Đã đặt lịch crawl hằng ngày (0 2 * * *)
```

### 5. Kiểm chứng bằng một vòng đời thật

Chạy lần lượt, giữ cookie phiên trong `/tmp/sb.txt`:

```bash
# Đăng ký (cookie phiên được set ngay, khỏi phải đăng nhập lại)
curl -s -c /tmp/sb.txt -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Lộc","email":"loc@demo.vn","password":"demo123456"}'

# Khai báo thể trạng + ngân sách -> nhận lại mục tiêu dinh dưỡng
curl -s -b /tmp/sb.txt -X PUT http://localhost:3001/api/profile \
  -H "Content-Type: application/json" \
  -d '{"heightCm":172,"weightKg":64,"age":21,"gender":"male",
       "activityLevel":"MODERATE","goal":"GAIN_MUSCLE","monthlyBudget":2400000}'

# Tạo thực đơn cả tuần
curl -s -b /tmp/sb.txt -X POST http://localhost:3001/api/planner/generate \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$(date +%F)\",\"range\":\"week\"}"

# Xem thực đơn hôm nay
curl -s -b /tmp/sb.txt "http://localhost:3001/api/planner?date=$(date +%F)"
```

Nếu bước cuối trả về một `plan` có 4 `items` thì backend đã chạy đúng toàn
tuyến: auth → hồ sơ → thuật toán chọn món → lưu DB → đọc lại.

### 6. Chạy cùng giao diện

Frontend nằm ở `Frontend/studentbite`, proxy sẵn `/api` sang `localhost:3001`
nên không cần cấu hình CORS:

```bash
cd ../Frontend/studentbite
npm install
npm run dev            # http://localhost:3000
```

Xem [tài liệu Frontend](../../Frontend/studentbite/docs/01-bat-dau.md) để biết chi tiết.

---

## Bảng lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | API + tự nạp lại khi sửa mã |
| `npm run dev:basic` | Chỉ API, log gọn hơn |
| `npm run db:up` | Bật PostgreSQL trong Docker |
| `npm run db:migrate` | Tạo migration mới sau khi sửa `schema.prisma` |
| `npm run db:seed` | Nạp lại dữ liệu mẫu (idempotent, chạy nhiều lần được) |
| `npm run crawl` | Chạy tay 3 crawler giá, không đợi cron |
| `npm test` | Vitest |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run build` | Lint + biên dịch ra `dist/` |

---

## Gỡ rối nhanh

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `Can't reach database server at localhost:5434` | Container chưa chạy | `npm run db:up` rồi đợi ~5 giây |
| `Environment variable not found: DATABASE_URL` | Prisma CLI không đọc `config/` | `export DATABASE_URL=...` như bước 3 |
| `EADDRINUSE :::3001` | Còn tiến trình cũ | `pkill -f "ts-node ./src/main"` |
| Đăng nhập được nhưng API khác trả 401 | Không gửi cookie | Thêm `-b /tmp/sb.txt` vào curl; trên trình duyệt cần `credentials: "include"` |
| Seed chạy nhưng bảng trống | Migration chưa chạy | `npx prisma migrate deploy` trước rồi seed lại |
