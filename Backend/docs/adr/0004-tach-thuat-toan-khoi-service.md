# ADR-0004 · Tách thuật toán chọn thực đơn thành hàm thuần

**Trạng thái:** Đã áp dụng
**Ngày:** 2026-07

## Bối cảnh

Chọn thực đơn là phần logic phức tạp nhất và cũng là phần dễ sai nhất của sản
phẩm: phải cân bằng protein, chi phí, và độ đa dạng cùng lúc
([05 · Nghiệp vụ](../05-nghiep-vu.md)). Cách viết tự nhiên là đặt thẳng vào
`PlannerService` cạnh các lệnh Prisma.

Nhưng logic đó cần được kiểm chứng bằng test — ví dụ "tổng chi phí không bao
giờ vượt ngân sách ngày" — mà viết test cho hàm có gọi DB thì phải dựng
database, seed dữ liệu, dọn dẹp sau mỗi ca.

## Quyết định

Tách làm hai file với ranh giới rõ:

| File | Vai trò | Chạm DB |
|---|---|---|
| [`planner-algorithm.ts`](../../src/services/planner-algorithm.ts) | Thuật toán thuần: nhận mảng `IDishLite` + `INutritionTargets`, trả về thực đơn | Không |
| [`PlannerService.ts`](../../src/services/PlannerService.ts) | Đọc hồ sơ, nạp món ăn, gọi thuật toán, ghi kết quả | Có |

Mọi nguồn ngẫu nhiên đi vào qua tham số `rng: () => number = Math.random`.

## Các lựa chọn đã cân nhắc

| Lựa chọn | Ưu | Nhược | Vì sao loại |
|---|---|---|---|
| Viết chung trong `PlannerService` | Ít file hơn | Test phải dựng DB; thuật toán lẫn với truy vấn | Phần cần test nhất lại thành phần khó test nhất |
| Tách nhưng vẫn dùng `Math.random` bên trong | Đơn giản | Test không lặp lại được kết quả | Không khẳng định được hành vi |
| Tách kèm bơm cả repository | Thay được nguồn dữ liệu | Thêm tầng trừu tượng chưa ai cần | Quá sớm |

## Hệ quả

**Được:**
- 12 test chạy trong mili giây, không cần Docker, không cần seed —
  [`tests/planner.test.ts`](../../tests/planner.test.ts).
- Khẳng định được các bất biến thật sự quan trọng: đủ 4 bữa, không vượt ngân
  sách, đạt ngưỡng protein, không trùng món.
- Thuật toán đọc được như một bài toán độc lập, không lẫn `await prisma...`.
- Đổi cách chấm điểm chỉ động vào một file, không sợ vỡ tầng dữ liệu.

**Mất:**
- Phải nạp **toàn bộ** bảng `Dish` vào bộ nhớ mỗi lần tạo thực đơn
  (`getAllDishes`). Với vài chục món thì không sao; vài nghìn món sẽ phải lọc
  bớt từ tầng truy vấn trước khi đưa vào thuật toán.
- Có thêm một kiểu trung gian `IDishLite` phải giữ đồng bộ với model Prisma.

**Xem lại quyết định khi:** danh mục món lớn tới mức không nên nạp hết, hoặc
khi thuật toán cần dữ liệu động (ví dụ giá crawl mới nhất theo từng cửa hàng)
— khi đó nên truyền dữ liệu đã lọc vào thay vì cho thuật toán tự truy vấn.
