# Khảo sát site

> Sự thật đo được về từng nguồn giá. Mọi con số đều kèm ngày đo — website đổi
> liên tục, số liệu không có ngày là số liệu vô dụng.

**Lần đo gần nhất:** 2026-08-02

---

## Tóm tắt

| Site | Đường dẫn hiện tại | Render | Trạng thái | Độ khó sửa |
|---|---|---|---|---|
| Bách Hóa Xanh | `/thit-ga`, `/rau-la`… vẫn đúng | **JavaScript** | Lấy được 0 sản phẩm | Cao |
| WinMart | `/categories/thit-1980` → **404** | Next.js | Lấy được 0 sản phẩm | Trung bình |
| Co.op Online | `/groups/thit-heo/` → **301** → `/c/thit-heo` | Server, có sẵn HTML | Lấy được 0 sản phẩm | **Thấp** |

Cả ba cùng ra 0 nhưng **ba nguyên nhân khác nhau** — đừng sửa chung một kiểu.

---

## Bách Hóa Xanh

**Đo 2026-08-02**

```
GET https://www.bachhoaxanh.com/thit-ga
→ HTTP 200, 96.167 bytes
```

| Thứ crawler đang tìm | Có trong HTML? |
|---|---|
| `<h3>` (tên sản phẩm) | **0** |
| `.product_price` | **0** |
| chuỗi `price` bất kỳ | 2 (không phải sản phẩm) |
| `__NEXT_DATA__` | **0** |

Trang tải được, `<title>` đúng ("Mua thịt gà, vịt sạch, tươi ngon tại
BachhoaXANH.com"), nhưng **danh sách sản phẩm không nằm trong HTML**. Nó được
JavaScript dựng sau khi tải. Cheerio chỉ đọc HTML tĩnh nên không bao giờ thấy.

**Manh mối quan trọng:** trong HTML có host API nội bộ

```
https://apibhx.tgdd.vn
```

và các bundle Next.js ở `cdnv2-tmdt.tgdd.vn/bhx/product-fe/...`. Nhiều khả
năng trang gọi API này để lấy danh sách sản phẩm.

**Việc cần làm để đi tiếp:** mở DevTools → tab Network → lọc `apibhx.tgdd.vn`
→ xem request nào trả danh sách sản phẩm, ghi lại URL đầy đủ, method, header
bắt buộc (có thể cần token hoặc `provinceId`/`storeId`).

Chưa dò được thì chưa chốt được hướng đi cho site này.

---

## WinMart

**Đo 2026-08-02**

```
GET https://winmart.vn/categories/thit-1980       → HTTP 404
GET https://winmart.vn/categories/thuy-hai-san-1981 → HTTP 404
… cả 6 danh mục trong CATEGORY_PATHS đều 404
GET https://winmart.vn                            → HTTP 200, 19.881 bytes
```

Trang chủ có `__NEXT_DATA__` (1 lần) → là Next.js, và code crawler **đã có
sẵn nhánh đọc `__NEXT_DATA__`** rồi duyệt đệ quy tìm object có `name` +
`price`. Nhánh đó chưa bao giờ chạy vì request 404 trước.

Nghĩa là: **có thể chỉ cần đúng URL là chạy được**, không phải viết lại
parser.

**Việc cần làm:** tìm đường dẫn danh mục hiện tại. Cách nhanh: mở
<https://winmart.vn>, bấm vào một danh mục thực phẩm, chép URL trên thanh
địa chỉ. Hoặc thử `https://winmart.vn/sitemap.xml`.

---

## Co.op Online

**Đo 2026-08-02**

```
GET https://cooponline.vn/groups/thit-heo/
→ HTTP 301 → https://cooponline.vn/c/thit-heo
→ theo redirect: HTTP 200, 1.063.756 bytes
```

Đường dẫn đã đổi từ `/groups/<tên>/` sang `/c/<tên>`. Ba trong tám danh mục
cũ trả 404 hẳn; số còn lại redirect sang trang mới. Axios tự đi theo redirect
nên vẫn tải được HTML — **vấn đề nằm ở selector, không phải URL**.

**Sản phẩm CÓ sẵn trong HTML.** Đếm trên `/c/thit-heo`:

| Class | Số lần |
|---|---|
| `product-card css-1msrncq` | 23 |
| `att-product-card-title css-8r8yx1` | 23 |
| `att-product-detail-latest-price css-g44th4` | 23 |
| `product-brand-name css-ppayij` | 23 |

Selector hiện tại của crawler là `.product-item, li.product,
[class*=product-inner]` — **không cái nào khớp** `product-card`.

**Cạm bẫy:** hậu tố `css-1msrncq` là class sinh bởi CSS-in-JS, **sẽ đổi mỗi
lần site build lại**. Selector phải bám vào phần ổn định:

- `[class*=product-card]` cho thẻ sản phẩm
- `[class*=att-product-card-title]` cho tên
- `[class*=att-product-detail-latest-price]` cho giá

Tiền tố `att-` trông giống thuộc tính gắn cho analytics nên nhiều khả năng ổn
định hơn phần hash.

**Đã thử và không dùng được:** `/wp-json/wc/store/products` → HTTP 404. Trang
có nhắc `wp-json` nhưng không mở REST API của WooCommerce.

**Đánh giá:** đây là site dễ sửa nhất — chỉ cần đổi `CATEGORY_PATHS` sang
dạng `/c/<tên>` và sửa lại ba selector. Nên làm đầu tiên để có ít nhất một
nguồn giá thật.

---

## Câu hỏi còn mở

| Câu hỏi | Cần ai trả lời |
|---|---|
| API `apibhx.tgdd.vn` nhận tham số gì, có cần token không? | Dò bằng DevTools |
| Đường dẫn danh mục WinMart hiện tại? | Dò bằng trình duyệt |
| Giá hiển thị đã gồm khuyến mãi chưa? Có giá gạch ngang không? | Cần xem kỹ từng site |
| Giá có phụ thuộc tỉnh/cửa hàng đang chọn không? | Nghi là **có** với BHX và WinMart |

Câu cuối quan trọng hơn vẻ ngoài của nó: nếu giá phụ thuộc cửa hàng thì "giá
rẻ nhất" mà app tính ra chỉ đúng với một khu vực, và cần thêm khái niệm khu
vực vào mô hình dữ liệu.
