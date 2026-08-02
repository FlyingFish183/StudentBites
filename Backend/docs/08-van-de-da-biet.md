# 08 · Vấn đề đã biết

> Những chỗ hệ thống chưa đúng hoặc chưa đủ, ghi lại để người sau không mất
> công phát hiện lại. Mỗi mục có mức ưu tiên và hướng xử lý.

**Loại tài liệu:** Reference. **Rà soát lần cuối:** 2026-08-02.

| Mức | Nghĩa |
|---|---|
| **P1** | Người dùng thật gặp phải, nên sửa trước |
| **P2** | Chưa lộ ra ngoài nhưng là rủi ro hoặc nợ kỹ thuật |
| **P3** | Dọn dẹp, không ảnh hưởng hành vi |

---

## P1 · `GET /api/profile` trả 404 thay vì `profile: null`

**Hiện tượng.** Người dùng vừa đăng ký, chưa qua onboarding, mà mở thẳng
trang chủ thì màn hình đứng ở khung chờ mãi mãi.

**Nguyên nhân.** [`ProfileService.getOne`](../src/services/ProfileService.ts)
ném `RouteError(404)` khi chưa có hồ sơ, nên `GET /api/profile` trả 404.
Frontend lại giả định endpoint trả `{ profile: null }` và dựa vào đó để đẩy
người dùng sang `/onboarding`; gặp 404 thì query rơi vào trạng thái lỗi, cờ
`hasProfile` không bao giờ bật, các query còn lại bị `enabled: false`.

**Ít gặp vì.** Luồng thường là đăng ký → chuyển thẳng sang `/onboarding`. Chỉ
lộ ra khi người dùng bấm nút Back hoặc mở lại app giữa chừng.

**Hướng sửa.** Cho `ProfileRoutes.getProfile` trả `200 { profile: null }` khi
chưa có hồ sơ — "chưa khai báo" là trạng thái hợp lệ, không phải lỗi. Giữ
nguyên hành vi ném 404 của `getTargets` vì ở đó hồ sơ là bắt buộc.

---

## P1 · `POST /api/logs` không chặn ghi trùng

Gọi hai lần cùng `date` + `mealType` sẽ tạo hai `MealLog`, và mọi thống kê
cộng đôi số liệu.

Giao diện hiện tự khoá nút sau khi đánh dấu, nhưng đó là phòng thủ ở sai lớp:
mạng chập chờn, bấm nhanh hai lần, hoặc gọi API trực tiếp đều lọt.

**Hướng sửa.** Thêm `@@unique([userId, date, mealType])` cho `MealLog` rồi
chuyển `LogService.add` sang `upsert`. Cần cân nhắc trước: người dùng có được
phép ghi hai bữa phụ trong một ngày không? Nếu có thì ràng buộc phải khác.

---

## P1 · Ngày tính theo UTC, người dùng ở UTC+7

Mọi mốc ngày đều neo `T00:00:00.000Z`
([`PlannerService.parseDateOnly`](../src/services/PlannerService.ts)). Trong
khung **00:00–07:00 giờ Việt Nam**, "hôm nay" theo điện thoại và "hôm nay"
theo server lệch nhau một ngày.

Hậu quả thực tế: ăn khuya lúc 1h sáng thì bữa đó bị ghi vào ngày hôm trước.

**Hướng sửa.** Chọn một trong hai, đừng nửa vời:
1. Cố định múi giờ ứng dụng là `Asia/Ho_Chi_Minh` và quy đổi ở biên API.
2. Cho client gửi kèm offset và server quy đổi theo đó (đúng hơn khi có người
   dùng đi nước ngoài, nhưng phức tạp hơn nhiều).

---

## P2 · Cron chạy chung tiến trình với API

[`src/main.ts`](../src/main.ts) đăng ký `node-cron` ngay trong tiến trình
Express. Chạy 2 bản sao API là 2 lần crawl cùng lúc lên cùng website — vừa
lãng phí vừa dễ bị chặn IP.

Với một máy chủ duy nhất thì không sao. Trước khi mở rộng, tách crawler ra
tiến trình riêng hoặc dùng khoá phân tán trong DB.

---

## P2 · Không xử lý giới hạn tần suất của Overpass

[`StoreService.nearby`](../src/services/StoreService.ts) gọi thẳng Overpass
mỗi lần đổi bán kính hoặc đổi vị trí, không cache theo toạ độ, không thử lại
khi bị `429`. Overpass là dịch vụ cộng đồng có giới hạn thật.

Bảng `Store` đã cache **kết quả** nhưng chưa dùng cache đó để **tránh gọi
lại** — lần sau vẫn hỏi Overpass rồi mới upsert.

**Hướng sửa.** Bỏ qua gọi mạng nếu đã có bản ghi `Store` trong bán kính đó và
`updatedAt` còn mới (ví dụ dưới 7 ngày); thêm backoff khi gặp 429/timeout.

---

## P2 · `parseWeightGrams` mặc định 1000g

Sản phẩm không ghi khối lượng trong tên bị coi là 1kg
([06 · Crawler](./06-crawler.md#bước-2--đọc-khối-lượng)). Một bó rau 300g bán
12 000₫ sẽ bị ghi thành 12₫/100g thay vì 40₫/100g — **rẻ hơn thực tế 3 lần**,
và màn so giá sẽ khuyên sai.

**Hướng sửa.** Trả `null` thay vì đoán, và bỏ qua sản phẩm không đọc được
khối lượng. Sót còn hơn sai.

---

## P2 · Ngân sách chia đều cả tháng, không phản ứng với thực chi

`dailyBudget = monthlyBudget ÷ số ngày trong tháng`, cố định suốt tháng. Tiêu
lố mười ngày liền thì hạn mức ngày vẫn y nguyên, hệ thống không hề siết lại.

Đây là **lựa chọn có chủ ý** để hạn mức ổn định, khác với bản kế hoạch ban đầu
(xem [05 · Nghiệp vụ](./05-nghiep-vu.md#ngân-sách)). Ghi ở đây vì đó là giới
hạn thật của sản phẩm, không phải vì nó là lỗi.

---

## P2 · Chưa có test cho tầng HTTP của ứng dụng

`tests/users.test.ts` chỉ kiểm route mẫu của template. Toàn bộ auth, planner,
logs, stores chưa có integration test — đặc biệt là **chưa có test chứng minh
người dùng A không chạm được dữ liệu người dùng B**.

Thứ tự nên viết nằm ở
[07 · Kiểm thử](./07-kiem-thu-va-quy-uoc.md#nên-viết-thêm-test-gì).

---

## P3 · Tàn dư của template Express

| Đường dẫn | Việc cần làm |
|---|---|
| `src/routes/UserRoutes.ts` + `/api/users/*` | Xoá. Đây là CRUD mẫu **không có `requireAuth`**, ghi vào file JSON qua `MockOrm` chứ không đụng bảng `User` thật — nên không rò rỉ tài khoản, nhưng vẫn là endpoint công khai ghi được xuống đĩa |
| `src/repos/MockOrm.ts`, `src/repos/UserRepo.ts`, `src/models/User.model.ts` | Xoá cùng lúc với trên |
| `src/services/UserService.ts` | Xoá cùng lúc với trên |
| `src/views/`, `src/public/`, route `GET /` và `GET /users` trong `server.ts` | Xoá — backend này chỉ phục vụ JSON, không phục vụ HTML |
| `npm run build:make-db` trong `package.json` | Xoá — bước này tạo file JSON cho MockOrm |

Dọn cả cụm này gỡ được `jsonfile` khỏi phụ thuộc và làm `src/` phản ánh đúng
những gì hệ thống thật sự chạy.

---

## P3 · Thông điệp lỗi chưa nhất quán ngôn ngữ

Phần lớn thông điệp đã là tiếng Việt hướng người dùng, nhưng
`UserService.Errors.USER_NOT_FOUND` còn là `'User not found'`. Sẽ tự hết khi
dọn xong mục trên.
