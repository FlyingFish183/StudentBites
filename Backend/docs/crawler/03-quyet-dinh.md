# Quyết định

> Chốt gì, vì sao, và khi nào nên xem lại. Nhẹ hơn ADR — một quyết định vài
> dòng là đủ. Cái nào lớn tới mức ảnh hưởng cả hệ thống thì viết ADR thật
> trong [`../adr/`](../adr/).

---

## Mẫu

```markdown
### QĐ-00X · <Chốt cái gì>

**Ngày:** YYYY-MM-DD · **Ai chốt:** <tên>

**Bối cảnh.** Vì sao phải quyết.
**Chốt.** Làm gì.
**Đánh đổi.** Được gì, mất gì.
**Xem lại khi.** Điều kiện nào thì lôi ra bàn lại.
```

---

## Đã chốt

### QĐ-001 · Crawler hỏng không được làm gãy app

**Ngày:** 2026-07 · **Ai chốt:** thiết kế ban đầu, ghi lại ở đây cho rõ

**Bối cảnh.** Website bán lẻ đổi HTML bất cứ lúc nào, không có cam kết nào cả.

**Chốt.** Crawler chỉ nuôi **một** tính năng là màn so giá. Thực đơn dùng
`Dish.estimatedCost` chốt sẵn trong danh mục; thống kê chi tiêu dùng
`MealLog.cost` do người dùng ghi. Seed nạp sẵn 84 dòng giá tham khảo cho 3
nguồn.

**Đánh đổi.** Giá trong danh mục món có thể lệch giá thị trường. Đổi lại, cả
ba crawler chết cùng lúc — **đúng như đang xảy ra hôm nay** — mà người dùng
vẫn dùng app bình thường.

**Xem lại khi.** Nếu sau này thực đơn cần tính giá theo giá crawl thời gian
thực thì ràng buộc này không còn giữ được.

---

### QĐ-002 · Chỉ đọc trang danh mục công khai, 1 lần/ngày

**Ngày:** 2026-07

**Chốt.** Không đăng nhập, không vượt tường phí, không crawl dày hơn 1
lần/ngày. Overpass và Nominatim (màn tìm cửa hàng) khai `User-Agent` riêng
`StudentBites/1.0 (student project)` đúng điều khoản OSM.

**Đánh đổi.** Giá có thể cũ tới 24 giờ. Trường `crawledAt` có sẵn để giao
diện nói rõ độ mới — nhưng **hiện chưa dùng để hiển thị**.

**Xem lại khi.** Sản phẩm chạy thật với người dùng thật; khi đó nên đọc
`robots.txt` và khai `User-Agent` có thông tin liên hệ thay vì giả làm trình
duyệt.

---

### QĐ-003 · Tách "giá hiện tại" khỏi "lịch sử giá"

**Ngày:** 2026-08-02 · **Migration:** `20260802172222_add_crawl_history_and_price_history`

**Bối cảnh.** `saveProducts` dùng `upsert` nên mỗi cặp (nguyên liệu, cửa hàng,
sản phẩm) chỉ có **một** dòng — giá cũ bị ghi đè mất. Không trả lời được câu
"giá ức gà tháng qua biến động ra sao".

**Chốt.** Hai bảng, hai vai trò:

| Bảng | Vai trò | Cách ghi |
|---|---|---|
| `IngredientPrice` | Giá **hiện tại** | `upsert` như cũ |
| `PriceHistory` | Diễn biến theo thời gian | Chỉ ghi thêm, không sửa |

`PriceHistory` **chỉ ghi khi giá khác lần quan sát gần nhất**. Crawl mỗi ngày
mà giá đứng yên thì không sinh dòng mới.

**Đánh đổi.** Dữ liệu lặp giữa hai bảng. Đổi lại màn so giá không phải sửa
dòng nào — nó vẫn đọc `IngredientPrice` như trước, và truy vấn giá hiện tại
không phải quét đống lịch sử.

**Xem lại khi.** Nếu sau này mọi truy vấn đều cần lịch sử thì gộp lại thành
một bảng append-only và lấy dòng mới nhất bằng `DISTINCT ON`.

---

### QĐ-004 · Ghi lại từng lượt crawl, tách tới mức danh mục

**Ngày:** 2026-08-02 · **Liên quan:** [C-05](./02-so-van-de.md#c-05--không-có-cảnh-báo-khi-tỉ-lệ-match-tụt)

**Bối cảnh.** Cả ba site hỏng nhiều ngày mà không ai biết, vì crawler báo
"hoàn tất" với 0 sản phẩm rồi log trôi đi.

**Chốt.** Hai bảng:

- `CrawlRun` — một dòng cho mỗi (lượt chạy × nguồn): thời gian, trạng thái,
  số sản phẩm bóc được, số khớp nguyên liệu, số giá đổi.
- `CrawlCategory` — một dòng cho mỗi danh mục trong lượt đó: đường dẫn, URL
  đầy đủ, **mã HTTP**, số sản phẩm, thời gian chạy, lỗi.

**Vì sao tách tới danh mục.** Đây là chỗ trả lời "đường dẫn nào đang 404" mà
không phải chạy lại crawler rồi ngồi đọc log — đúng thứ đang cần cho C-01 và
C-02.

**Đánh đổi.** Mỗi lượt crawl sinh ~3 dòng `CrawlRun` + ~24 dòng
`CrawlCategory`, tức khoảng 10 nghìn dòng một năm. Không đáng kể, nhưng chưa
có cơ chế dọn.

---

### QĐ-005 · Thêm `Store.code` làm định danh nguồn crawl

**Ngày:** 2026-08-02

**Bối cảnh.** `saveProducts` tra cửa hàng bằng
`findFirst({ where: { sourceSite } })`, mà `sourceSite` không unique — kết quả
không xác định nếu có hơn một cửa hàng cùng nguồn. Ngoài ra `osmId` đang bị
mượn làm khoá chung với giá trị giả `online-coopmart`.

**Chốt.** Thêm cột `Store.code` unique, null với cửa hàng lấy từ OSM.
Migration backfill sẵn `code = sourceSite` cho 3 cửa hàng online.

**Đánh đổi.** Thêm một cột gần trùng `sourceSite`. Đổi lại tra cứu thành
`findUnique`, và không phải bịa giá trị `osmId` cho thứ không đến từ OSM.

**Chưa làm.** `common.ts` vẫn đang dùng `findFirst` — đổi sang `findUnique`
lúc sửa crawler.

---

### QĐ-006 · BullMQ + Redis thay node-cron, worker chạy tiến trình riêng

**Ngày:** 2026-08-02 · **Ai chốt:** bạn yêu cầu "cần cơ chế như Sidekiq"

**Bối cảnh.** `node-cron` gọi thẳng hàm trong tiến trình API: không thử lại
khi lỗi, không thấy được gì đang chạy, mất hết khi khởi động lại, và chạy
nhiều bản API là crawl trùng nhau (C-06).

**Chốt.** BullMQ trên Redis — bản tương đương Sidekiq bên Node.

| | Trước | Sau |
|---|---|---|
| Lịch | node-cron trong RAM | Job scheduler trong Redis |
| Thử lại | Không | 3 lần, backoff mũ 30s → 60s → 120s |
| Nhìn thấy | Một dòng log rồi trôi | Dashboard `/api/admin/queues` |
| Tiến trình | Chung với API | `npm run worker` riêng |
| Mất khi restart | Mất hết | Job nằm lại trong Redis |

**Một quyết định nhỏ nhưng quan trọng:** crawl xong mà `productsFound === 0`
thì worker **ném lỗi** chứ không báo thành công. Trả 0 rồi ghi "hoàn tất"
chính là cách cả ba site hỏng nhiều ngày mà không ai biết.

**Đánh đổi.**
- Thêm một hạ tầng phải chạy (Redis) và một tiến trình phải trông (worker).
- Có thể dùng `pg-boss` để chạy hàng đợi trên PostgreSQL sẵn có, khỏi thêm
  Redis. Đã cân nhắc và **không chọn** vì bạn yêu cầu Redis, và BullMQ có
  dashboard sẵn nên gần Sidekiq hơn.
- `concurrency: 1` — cố ý không crawl song song để đỡ bị chặn IP và để log dễ
  đọc.

**Xem lại khi.** Nếu về sau chỉ còn một loại job và không cần dashboard nữa
thì `pg-boss` gọn hơn, bớt được một hạ tầng.

---

## Đang chờ chốt

| Cần quyết | Chặn việc gì | Bàn ở đâu |
|---|---|---|
| Mục tiêu của crawler cho đồ án | Quyết định mức đầu tư cho C-01→C-03 | [`00-brainstorm.md`](./00-brainstorm.md) câu 1 |
| Có giữ ba site này không | C-02, C-03 | câu 2 |
| Chấp nhận Playwright không | C-03 | câu 3 |
| Vai trò lâu dài của giá seed | Có cần phân biệt giá thật / giá tham khảo trên giao diện | câu 4 |
