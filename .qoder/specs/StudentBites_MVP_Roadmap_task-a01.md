# StudentBites — Kế hoạch xây dựng MVP

## Tóm tắt

Tận dụng 2 template sẵn có: `Backend/` (Express 5 + TypeScript, cấu trúc routes/services/repos) và `Frontend/studentbite/` (Next.js 16 + Tailwind 4). Thay mock JSON DB bằng PostgreSQL + Prisma. Build theo 4 giai đoạn tương ứng 5 module nghiệp vụ, ưu tiên UI/UX mobile-first.

**Stack đã chốt:** PostgreSQL + Prisma | Crawler chạy định kỳ (node-cron) | Leaflet + OpenStreetMap (Nominatim + Overpass) | Auth email/password (JWT httpOnly cookie).

**Giả định:** 3 website crawl là Bách Hóa Xanh, WinMart, Co.op Online (đổi được sau); tiền tệ VND; UI tiếng Việt.

## Giai đoạn 1 — Nền tảng: DB, Auth, Hồ sơ & Ngân sách (Module 1)

### Backend
- Thêm `docker-compose.yml` chạy PostgreSQL local; thêm Prisma (`prisma/schema.prisma`), cập nhật `Backend/config/.env.development` với `DATABASE_URL`.
- Schema Prisma (toàn bộ, tạo ngay từ đầu):
  - `User` (email, passwordHash, name)
  - `Profile` (heightCm, weightKg, activityLevel, goal: GAIN_MUSCLE/LOSE_FAT/MAINTAIN, monthlyBudget)
  - `Ingredient` (tên, đơn vị, protein/carb/fat/kcal trên 100g, category)
  - `Store` (tên, loại: chợ/siêu thị/cửa hàng, lat, lng, address, sourceSite)
  - `IngredientPrice` (ingredientId, storeId, price, unitQty, productUrl, crawledAt)
  - `Dish` + `DishIngredient` (món ăn + định lượng nguyên liệu → tự tính macro & giá)
  - `MealPlan` + `MealPlanItem` (ngày, bữa: SÁNG/TRƯA/TỐI/PHỤ, dishId, estimatedCost)
  - `MealLog` (userId, date, mealType, dishId hoặc món tự nhập, protein/carb/fat/kcal, cost)
- Thay dần `Backend/src/repos/MockOrm.ts` + `UserRepo.ts` bằng Prisma client; giữ nguyên convention routes → services → repos của template.
- **Auth**: `bcrypt` + `jsonwebtoken`, cookie httpOnly (template đã có `cookie-parser`). Routes: `POST /api/auth/register|login|logout`, `GET /api/auth/me`. Middleware `requireAuth` gắn userId vào request.
- **FR-1.1→1.3**: `PUT /api/profile` lưu thể trạng + ngân sách tháng; service tính:
  - Ngân sách ngày = ngân sách tháng còn lại / số ngày còn lại; chia theo tỉ lệ bữa (Sáng 25% / Trưa 35% / Tối 30% / Phụ 10%).
  - TDEE theo công thức Mifflin-St Jeor × hệ số vận động; protein mục tiêu = 1.6–2.2 g/kg tùy goal.

### Frontend
- Cài: `@tanstack/react-query`, `zod`, `react-hook-form`, `recharts`, `leaflet` + `react-leaflet`, `date-fns`.
- Layout mobile-first: bottom tab bar 4 tab (Trang chủ / Thực đơn / Lịch sử / Mua sắm), max-width container ~480px trên desktop, safe-area cho iOS.
- Trang `/login`, `/register`, `/onboarding` (wizard 3 bước: thể trạng → mục tiêu → ngân sách).

## Giai đoạn 2 — Gợi ý thực đơn thông minh (Module 2)

### Backend
- Seed data: ~40–60 nguyên liệu phổ biến (trứng, ức gà, đậu hũ, thịt băm, cá, rau...) kèm macro chuẩn + giá tham khảo; ~30–50 món ăn sinh viên dễ nấu (`prisma/seed.ts`).
- **FR-2.1** `POST /api/planner/generate?range=day|week`: thuật toán greedy có ràng buộc — với mỗi bữa, chọn món sao cho tổng ngày đạt ngưỡng protein mục tiêu và tổng chi phí ≤ ngân sách ngày (ưu tiên món protein/giá tốt nhất, có yếu tố random để đa dạng). Đây là core logic, viết test vitest riêng.
- **FR-2.2** `POST /api/planner/swap`: đổi 1 món trong plan, trả về món thay thế cùng bữa với chi phí/macro tương đương, tự tính lại tổng.
- **FR-2.3**: response luôn kèm `budgetStatus` (tổng chi phí vs ngân sách ngày) để FE hiện cảnh báo.

### Frontend
- Trang `/planner`: xem theo ngày/tuần, card từng bữa hiển thị món + giá + macro, nút "Đổi món", banner cảnh báo đỏ khi vượt ngân sách ngày.

## Giai đoạn 3 — Chi phí, Lịch sử & Dinh dưỡng (Module 3 + 4)

### Backend
- **FR-4.2** `POST /api/logs`: đánh dấu "Đã ăn" từ plan hoặc thêm món ngoài (nhập tay macro + giá).
- **FR-3.2, 3.3** `GET /api/logs?month=` và `GET /api/logs/:date`: lịch sử theo tháng/ngày, chi tiết từng bữa (món, protein, tiền).
- **FR-3.4, 4.1** `GET /api/stats/daily?date=` và `GET /api/stats/spending?range=week|month`: tổng hợp macro trong ngày vs mục tiêu; chi tiêu thực tế vs ngân sách.
- **FR-4.3**: endpoint `GET /api/stats/daily` trả kèm cờ `proteinWarning`; FE hiển thị nhắc nhở cuối ngày (chưa cần push notification ở MVP).

### Frontend
- Trang `/` (Dashboard): progress bar Protein/Carb/Fat/Calories hôm nay, ngân sách còn lại trong ngày, thực đơn hôm nay với nút "Đã ăn ✓".
- Trang `/history`: Calendar view theo tháng + list; tap vào ngày xem chi tiết bữa; tab "Thống kê" với biểu đồ recharts so sánh ngân sách vs chi tiêu theo tuần/tháng.

## Giai đoạn 4 — Bản đồ & So sánh giá (Module 5 + Crawler)

### Crawler (Backend)
- Thư mục `Backend/src/crawlers/`: mỗi site 1 file (`bachhoaxanh.ts`, `winmart.ts`, `coopmart.ts`) + `runner.ts` chạy bằng `node-cron` (1 lần/ngày) và script chạy tay `npm run crawl`.
- Dùng `axios` + `cheerio` cho trang render tĩnh; site nào render bằng JS thì dùng `playwright`. Chỉ crawl danh mục thực phẩm tươi sống/đồ ăn liên quan đến bảng `Ingredient`.
- Mapping sản phẩm → `Ingredient` bằng bảng từ khóa (vd "ức gà" match "Ức gà phi lê 500g"), chuẩn hóa giá về VND/kg hoặc VND/đơn vị, upsert vào `IngredientPrice`.
- Fallback: nếu crawl fail (đổi HTML, chặn IP), hệ thống vẫn chạy bằng giá seed cũ + hiển thị `crawledAt` để user biết độ mới của giá.

### Backend API
- **FR-5.1, 5.2** `GET /api/stores/nearby?lat=&lng=&radius=`: gọi Overpass API tìm `shop=supermarket|convenience|marketplace` trong bán kính 1–5km, cache kết quả vào bảng `Store`. Geocode địa chỉ tự nhập qua Nominatim.
- **FR-5.3** `GET /api/stores/compare?planItemId=`: từ danh sách nguyên liệu của bữa/thực đơn, join `IngredientPrice` → trả về nơi mua rẻ nhất cho từng nguyên liệu + tổng tiền tối ưu theo từng cửa hàng.

### Frontend
- Trang `/stores`: bản đồ Leaflet + marker cửa hàng, slider bán kính, danh sách nguyên liệu cần mua cho thực đơn đang chọn, bảng so sánh giá theo cửa hàng, nút "Chỉ đường" mở deep-link `https://maps.google.com/?daddr=lat,lng` (tự động dùng Apple Maps trên iOS).

## Kế hoạch kiểm thử
- Vitest (template có sẵn `Backend/tests/`): unit test thuật toán planner (đạt protein, không vượt ngân sách), test tính TDEE/protein target, test parser của từng crawler với HTML fixture; integration test các route auth/logs bằng supertest.
- Frontend: kiểm tra thủ công viewport mobile (375px) cho toàn bộ flow; lighthouse mobile cho dashboard.

## Thứ tự thực hiện ngay
1. Docker PostgreSQL + Prisma schema + migrate + seed.
2. Auth + Profile API → trang login/onboarding.
3. Planner API + trang thực đơn.
4. Logs/Stats API + Dashboard + History.
5. Crawler + Stores API + trang bản đồ.