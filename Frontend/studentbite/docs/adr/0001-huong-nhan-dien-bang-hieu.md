# ADR-0001 · Chọn hướng nhận diện "Bảng Hiệu" và cam kết một tông màu

**Trạng thái:** Đã áp dụng
**Ngày:** 2026-08

## Bối cảnh

Bản đầu của app chạy được đủ 5 màn nhưng mặc chiếc áo mặc định của Tailwind:
xanh `green-600`, thẻ trắng bo tròn, emoji làm icon, mỗi màn tự viết lại chuỗi
class. Không sai, nhưng không phải nhận diện của ai cả — và mỗi lần thêm màn
thì độ lệch lại tăng.

Yêu cầu đặt ra: giao diện phải **có cá tính, hiện đại, có hướng riêng**.

## Quyết định

Chọn hướng **"Bảng Hiệu"**: lấy chất liệu từ tấm bảng hiệu quán cơm sinh viên
sơn men — nền xanh men `#0C4A4E`, chữ vàng `#FFCE2E`, giá đỏ `#EE3B2E`, viền
đen dày, bóng đổ cứng không blur, chữ tiêu đề Anton in hoa.

Kèm theo: **cam kết một tông màu duy nhất**, không làm chế độ sáng/tối.

## Các lựa chọn đã cân nhắc

Ba hướng đều được dựng thành màn hình thật với dữ liệu thật rồi đặt cạnh nhau
để so, thay vì mô tả bằng chữ.

| Hướng | Ý tưởng | Ưu | Nhược | Kết quả |
|---|---|---|---|---|
| **Biên Lai** | Giao diện như hoá đơn in nhiệt: giấy xám, mực đen, chấm nối, số mono | Chính xác, trưởng thành, rất hợp màn dữ liệu dày | Lạnh và nghiêm, không có giọng | Loại |
| **Khay Cơm** | Chia ô kiểu bento trên nền tối, màu là màu đồ ăn và mã hoá thông tin | Hiện đại, gọn, dễ dùng lâu | An toàn, ít cá tính; nền tối cần thêm bản sáng | Loại |
| **Bảng Hiệu** | Bảng hiệu quán ăn sơn men | Có giọng rõ, rất Việt Nam mà không dùng hoạ tiết dân tộc sáo mòn | Ồn; màn dữ liệu dày phải tiết chế | **Chọn** |

Một hướng thứ tư — nền gần đen với một màu neon nhấn — bị loại từ đầu vì đó là
mẫu giao diện đang bị dùng quá nhiều, chọn nó là quay lại đúng chỗ xuất phát.

## Hệ quả

**Được:**
- Ảnh chụp màn hình nhận ra ngay, không lẫn với app khác.
- Bảng token màu buộc phải kỷ luật: `sign` là thương hiệu, `chili`/`mango`/
  `mint` là ngữ nghĩa, không dùng lẫn.
- Không bo góc + viền dày + bóng cứng là ba quy tắc dễ kiểm tra — nhìn là biết
  đúng hay sai, khỏi tranh luận.
- Bỏ chế độ sáng/tối tiết kiệm một nửa số biến thể phải thiết kế và kiểm tra.

**Mất:**
- **Ồn.** Dùng lâu có thể mệt mắt. Màn Lịch sử và biểu đồ phải tiết chế đáng
  kể so với các màn khác.
- Vàng thương hiệu sáng hơn ngưỡng khuyến nghị cho nền tối. Đã kiểm bằng công
  cụ và **cố ý giữ** vì làm tối vàng lại khiến độ tách biệt khi mù màu tụt từ
  ΔE 24.3 xuống 4.9 — hỏng đúng thứ quy tắc đó sinh ra để bảo vệ. Bù lại bằng
  chú giải có nhãn chữ.
- Không có chế độ tối nghĩa là người dùng quen chế độ tối sẽ không có lựa
  chọn. Chấp nhận được vì nền app vốn đã tối.
- Anton in hoa **viết hoa cả `đ` và `g`**, làm sai ký hiệu tiền và đơn vị.
  Phải có thêm lớp `.disp-num` không in hoa dành riêng cho số.

**Xem lại quyết định khi:** app thêm nhiều màn dữ liệu dày (báo cáo, bảng
biểu) tới mức độ ồn cản trở việc đọc, hoặc khi có người dùng phản ánh mỏi mắt
khi dùng lâu.
