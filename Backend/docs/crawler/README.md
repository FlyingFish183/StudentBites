# Sổ tay crawler

> Chỗ làm việc cho phần crawl giá: ghi ý tưởng, khảo sát site, theo dõi vấn
> đề, chốt hướng đi. Khác với tài liệu tham chiếu — ở đây được phép lộn xộn,
> nửa vời, và sai.

**Cập nhật:** 2026-08-02

---

## Thư mục này khác gì `06-crawler.md`

| | [`06-crawler.md`](../06-crawler.md) | Thư mục này |
|---|---|---|
| Trả lời | "Hệ thống crawl **đang** hoạt động ra sao" | "Ta **định** làm gì và đang vướng gì" |
| Tính chất | Đã chốt, chính xác, đọc để hiểu | Đang nghĩ, có thể sai, viết để nghĩ tiếp |
| Nhịp đổi | Chỉ đổi khi mã đổi | Đổi liên tục |
| Ai viết | Chủ yếu là mã tự nói, tài liệu diễn giải | Chủ yếu là bạn |

Khi một ý ở đây được chốt và triển khai xong → cập nhật `06-crawler.md`, rồi
ghi lại ở [`03-quyet-dinh.md`](./03-quyet-dinh.md) một dòng là xong.

---

## Các file

| File | Dùng để |
|---|---|
| [`00-brainstorm.md`](./00-brainstorm.md) | **Chỗ của bạn.** Ý tưởng thô, yêu cầu, ràng buộc, thứ tự ưu tiên. Không cần gọn |
| [`01-khao-sat.md`](./01-khao-sat.md) | Sự thật về từng site: URL, cách render, API, cái gì hỏng. Có số liệu, có ngày đo |
| [`02-so-van-de.md`](./02-so-van-de.md) | Sổ vấn đề: mỗi vấn đề một dòng, có trạng thái |
| [`03-quyet-dinh.md`](./03-quyet-dinh.md) | Chốt gì, vì sao, khi nào xem lại |

---

## Quy ước

1. **Khảo sát phải kèm ngày đo.** Website đổi liên tục; một dòng "BHX render
   bằng JS" mà không có ngày thì sáu tháng sau vô dụng.
2. **Vấn đề thì ghi vào sổ, đừng sửa lén.** Sửa xong đổi trạng thái thành
   `xong` kèm commit, để lần sau vỡ lại còn biết trước đây đã làm gì.
3. **Brainstorm không cần đúng.** Ý dở cũng ghi — biết một hướng đã bị loại
   và vì sao thì đỡ mất công thử lại.
4. **Số liệu hơn cảm tính.** "Match 31/214 sản phẩm" nói được nhiều hơn
   "crawler chạy tàm tạm".

---

## Tình trạng hôm nay, một dòng

**Cả ba crawler đang trả về 0 sản phẩm.** Ba nguyên nhân khác nhau, xem
[`02-so-van-de.md`](./02-so-van-de.md). App không gãy vì màn so giá vẫn chạy
bằng 84 dòng giá seed.
