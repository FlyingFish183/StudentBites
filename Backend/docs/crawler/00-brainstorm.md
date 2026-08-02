# Brainstorm

> Chỗ của bạn. Viết thô cũng được, gạch đầu dòng cũng được, tiếng Việt không
> dấu cũng được. Không ai đọc file này để đánh giá — nó tồn tại để nghĩ.

---

## Ghi nhanh

<!-- Viết bất cứ gì vào đây. Ý mới, thứ chợt nghĩ ra, link tham khảo… -->



---

## Vài câu đang chờ bạn quyết

Đây là những chỗ tôi **không nên tự quyết** vì nó phụ thuộc mục tiêu của bạn
với đồ án. Trả lời được câu nào thì viết ngay dưới câu đó.

### 1. Crawler này để làm gì cho đồ án?

Cùng một cái crawler nhưng ba mục tiêu khác nhau dẫn tới ba cách làm khác nhau:

- **Chỉ cần demo được lúc bảo vệ** → sửa selector cho chạy hôm đó là đủ, không
  cần bền.
- **Cần chạy đều mỗi ngày** → phải chịu được website đổi cấu trúc, cần cảnh
  báo khi tỉ lệ match tụt.
- **Cần dữ liệu giá chính xác để so sánh thật** → phải giải quyết chuyện quy
  đổi đơn vị và khuyến mãi, khó hơn nhiều so với việc lấy được dữ liệu.

Trả lời:

### 2. Ba site hiện tại có phải là ba site đúng không?

Bách Hóa Xanh / WinMart / Co.op là **giả định trong roadmap ban đầu**, không
phải yêu cầu. Có thể đổi sang site dễ crawl hơn, hoặc nguồn khác hẳn (chợ
đầu mối, API giá công khai…).

Trả lời:

### 3. Chấp nhận Playwright không?

Bách Hóa Xanh dựng danh sách bằng JavaScript nên `axios + cheerio` không thấy
gì. Ba đường đi:

| Cách | Được | Mất |
|---|---|---|
| Gọi API JSON nội bộ (`apibhx.tgdd.vn`) | Nhanh, sạch, bền hơn HTML | Phải dò ra tham số; API nội bộ có thể đổi không báo |
| Playwright | Chắc ăn, thấy đúng cái người dùng thấy | Nặng, chậm, thêm phụ thuộc lớn |
| Bỏ BHX, tìm site khác | Đỡ đau đầu | Mất một nguồn giá |

Trả lời:

### 4. Dữ liệu seed đóng vai trò gì về lâu dài?

Hiện có 84 dòng giá seed sinh từ `basePricePerKg` nhân hệ số. Nhờ nó mà màn
so giá vẫn chạy dù crawler chết.

- Giữ làm phương án dự phòng vĩnh viễn?
- Hay chỉ là tạm, crawl chạy được thì xoá?
- Nếu giữ: giao diện có cần phân biệt "giá crawl thật" với "giá tham khảo"
  không? (`crawledAt` đang có sẵn nhưng chưa dùng để hiển thị)

Trả lời:

### 5. Bao lâu crawl một lần?

Hiện là 2h sáng mỗi ngày. Giá thực phẩm tươi đổi theo ngày, nhưng crawl dày
hơn thì rủi ro bị chặn IP cao hơn.

Trả lời:

---

## Ý đã nghĩ tới rồi nhưng chưa làm

<!-- Ghi cả ý đã loại, kèm lý do loại — để khỏi thử lại lần nữa -->

| Ý | Trạng thái | Ghi chú |
|---|---|---|
| | | |

---

## Câu hỏi cho tôi

<!-- Chỗ này bạn hỏi, tôi trả lời rồi ghi thẳng vào đây -->
