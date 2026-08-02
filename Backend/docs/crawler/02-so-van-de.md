# Sổ vấn đề

> Mỗi vấn đề một mục, có mã để nhắc tới trong commit và khi trao đổi. Sửa
> xong đổi trạng thái, **không xoá** — lần sau vỡ lại còn biết trước đây đã
> làm gì.

**Trạng thái:** `mở` · `đang làm` · `xong` · `bỏ qua`

---

## Đang mở

| Mã | Vấn đề | Mức | Trạng thái |
|---|---|---|---|
| C-01 | Co.op: selector không khớp markup hiện tại | Cao | mở |
| C-02 | WinMart: toàn bộ URL danh mục trả 404 | Cao | mở |
| C-03 | Bách Hóa Xanh: trang render bằng JS, cheerio không đọc được | Cao | mở |
| C-04 | `parseWeightGrams` mặc định 1000g khi không đọc được khối lượng | Trung bình | **xong** |
| C-05 | Không có cảnh báo khi tỉ lệ match tụt | Trung bình | đang làm |
| C-06 | Cron chạy chung tiến trình với API | Thấp | **xong** |

---

### C-01 · Co.op: selector không khớp markup hiện tại

**Hiện tượng.** `coopmart: lấy được 0 sản phẩm, match 0 nguyên liệu`

**Nguyên nhân.** Selector đang là `.product-item, li.product,
[class*=product-inner]`, còn markup thật dùng `product-card`,
`att-product-card-title`, `att-product-detail-latest-price`. Kèm theo đó
`CATEGORY_PATHS` vẫn dùng `/groups/<tên>/` trong khi site đã chuyển sang
`/c/<tên>`.

**Cách sửa.** Đổi `CATEGORY_PATHS` và ba selector. Chi tiết ở
[`01-khao-sat.md`](./01-khao-sat.md#coop-online).

**Lưu ý khi sửa.** Đừng bám vào hậu tố `css-1msrncq` — đó là hash CSS-in-JS,
đổi mỗi lần site build lại. Dùng `[class*=...]` với phần ổn định.

**Vì sao làm trước.** Rẻ nhất và cho kết quả thật nhanh nhất: dữ liệu đã nằm
sẵn trong HTML, chỉ là đang tìm sai chỗ.

---

### C-02 · WinMart: toàn bộ URL danh mục trả 404

**Hiện tượng.** Cả 6 đường dẫn trong `CATEGORY_PATHS` đều `HTTP 404`.

**Nguyên nhân.** Site đổi cấu trúc URL. Dạng `/categories/thit-1980` không
còn tồn tại.

**Cách sửa.** Tìm đường dẫn hiện tại rồi thay vào mảng. **Có thể không phải
sửa parser**: crawler đã có sẵn nhánh đọc `__NEXT_DATA__` và trang chủ
WinMart xác nhận vẫn là Next.js — nhánh đó chưa từng chạy vì request chết
trước.

**Chưa biết.** Đường dẫn mới là gì. Cần mở trình duyệt bấm thử, hoặc đọc
`sitemap.xml`.

---

### C-03 · Bách Hóa Xanh: trang render bằng JS

**Hiện tượng.** HTTP 200, HTML 96KB, nhưng 0 thẻ `<h3>`, 0 `.product_price`.

**Nguyên nhân.** Danh sách sản phẩm do JavaScript dựng sau khi tải. `axios +
cheerio` chỉ thấy HTML tĩnh.

**Ba hướng.** Gọi API nội bộ `apibhx.tgdd.vn` · dùng Playwright · bỏ site này.
So sánh đánh đổi ở [`00-brainstorm.md`](./00-brainstorm.md) câu 3 — **đang
chờ bạn chốt**.

**Chặn ở đâu.** Chưa dò được tham số của API nội bộ.

---

### C-04 · `parseWeightGrams` mặc định 1000g

**Hiện tượng.** Sản phẩm không ghi khối lượng trong tên bị coi là 1kg.

**Hậu quả.** Một bó rau 300g giá 12.000₫ bị tính thành 12₫/100g thay vì
40₫/100g — **rẻ hơn thực tế 3 lần**, và màn so giá sẽ khuyên sai.

**Đã sửa (2026-08-02).** `parseWeightGrams` trả `null` thay vì đoán.
`Product.baseWeightGrams` và `pricePerGram` cho phép null; sản phẩm thiếu khối
lượng bị loại khỏi so giá. `saveProducts` đếm riêng số sản phẩm dạng này
(`noWeight`) để biết tỉ lệ ngay lần crawl đầu. Xem
[QĐ-007](./03-quyet-dinh.md).

---

### C-05 · Không có cảnh báo khi tỉ lệ match tụt

**Hiện tượng.** Crawler chạy "thành công" với 0 sản phẩm và chỉ ghi một dòng
log. Không ai biết cho tới khi mở màn so giá.

**Đây chính là lý do cả ba site hỏng mà không ai phát hiện.**

**Đã làm (2026-08-02).** Thêm bảng `CrawlRun` + `CrawlCategory` +
`PriceHistory` — xem [QĐ-004](./03-quyet-dinh.md). Ba bảng đã có trong DB và
tự hiện ở khu quản trị.

**Còn lại.** Crawler **chưa ghi** vào ba bảng đó — `common.ts` và `runner.ts`
vẫn như cũ. Phần cảnh báo khi tỉ lệ match tụt cũng chưa có. Làm cùng lúc với
C-01.

---

### C-06 · Cron chạy chung tiến trình với API — ✅ xong 2026-08-02

**Đã sửa.** Bỏ `node-cron`, chuyển sang BullMQ + Redis với tiến trình worker
riêng (`npm run worker`). Lịch nằm trong Redis nên nhiều bản worker vẫn chỉ
sinh một job mỗi mốc. Xem [QĐ-006](./03-quyet-dinh.md).

---

## Đã xong

| Mã | Vấn đề | Xong ở |
|---|---|---|
| C-06 | Cron chạy chung tiến trình với API | QĐ-006, 2026-08-02 |
| C-04 | parseWeightGrams đoán 1000g | QĐ-007, 2026-08-02 |
