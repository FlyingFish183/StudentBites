# ADR-0003 · Dùng OpenStreetMap (Overpass + Nominatim) thay vì Google Maps

**Trạng thái:** Đã áp dụng
**Ngày:** 2026-07

## Bối cảnh

Tính năng "Đi chợ" cần ba thứ: tìm chợ/siêu thị quanh một toạ độ, đổi địa chỉ
chữ thành toạ độ, và hiển thị bản đồ. Dự án là bài tập của sinh viên — không
có thẻ tín dụng để đăng ký dịch vụ tính phí, và không muốn khoá người dùng
vào một nhà cung cấp.

## Quyết định

- **Tìm địa điểm:** Overpass API, truy vấn `shop=supermarket|convenience` và
  `amenity=marketplace` trong bán kính.
- **Geocode:** Nominatim, giới hạn `countrycodes=vn`.
- **Hiển thị:** Leaflet + tile OSM ở phía frontend.
- Khai `User-Agent: StudentBites/1.0 (student project)` đúng điều khoản OSM.
- Cache kết quả vào bảng `Store` theo `osmId`.

## Các lựa chọn đã cân nhắc

| Lựa chọn | Ưu | Nhược | Vì sao loại |
|---|---|---|---|
| Google Places + Maps JS | Dữ liệu POI Việt Nam đầy đủ nhất, đặc biệt là chợ nhỏ | Bắt buộc gắn thẻ thanh toán; điều khoản cấm lưu trữ lâu dài kết quả | Không có thẻ, và cần cache vào DB |
| Mapbox | Bản đồ đẹp, hạn mức miễn phí rộng | Vẫn cần tài khoản; tìm POI yếu hơn ở Việt Nam | Thêm ràng buộc mà không thêm giá trị |
| OSM *(đã chọn)* | Miễn phí, không cần khoá API, cache thoải mái | Dữ liệu thưa ở vùng ngoài đô thị; dịch vụ có giới hạn tần suất | — |
| Tự nhập cửa hàng bằng tay | Kiểm soát hoàn toàn | Người dùng phải tự nhập, không ai làm | Giết luôn tính năng |

## Hệ quả

**Được:**
- Không khoá API, không hoá đơn, ai clone repo về cũng chạy được ngay.
- Được phép cache vào `Store` — nhờ vậy màn hình vẫn còn dữ liệu khi Overpass
  chậm hoặc từ chối phục vụ.
- Ở nội thành TP.HCM, một truy vấn bán kính 2km trả về ~60 địa điểm — đủ dùng.

**Mất:**
- **Chất lượng dữ liệu phụ thuộc cộng đồng.** Nhiều chợ truyền thống nhỏ chưa
  được ghi vào OSM, và kết quả nghiêng hẳn về chuỗi cửa hàng tiện lợi. Đây là
  giới hạn thật của tính năng, người dùng sẽ nhận ra.
- Overpass là dịch vụ cộng đồng, có giới hạn tần suất và đôi khi chậm vài
  giây. Hiện **chưa xử lý `429` và chưa dùng cache để tránh gọi lại** — xem
  [08 · Vấn đề đã biết](../08-van-de-da-biet.md).
- Không có ảnh, giờ mở cửa, đánh giá như Google Places.
- Tính khoảng cách bằng haversine trong Node
  ([`StoreService`](../../src/services/StoreService.ts)) vì chưa bật PostGIS —
  đủ chính xác trong bán kính vài km.

**Xem lại quyết định khi:** sản phẩm ra thật và cần độ phủ chợ dân sinh, hoặc
khi lưu lượng vượt mức lịch sự với Overpass công cộng — lúc đó có thể tự dựng
một Overpass instance thay vì đổi sang dịch vụ trả phí.
