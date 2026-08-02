# 08 · Quy ước & kiểm thử

> Quy ước mã nguồn đang được tuân theo, và cách kiểm tra trước khi mở pull
> request.

**Loại tài liệu:** Reference + How-to.

---

## Quy ước mã nguồn

### Đặt file ở đâu

| Loại | Nơi | Dấu hiệu nhận biết |
|---|---|---|
| Dùng lại được, thuần trình bày | `components/ui/` | Không gọi API, không biết màn hình nào đang dùng |
| Dùng lại được, có logic riêng | `components/` | `SideNav`, `TabBar`, `StoreMap` |
| Chỉ một màn dùng | Ngay trong `page.tsx` đó | Đừng vội tách sớm |
| Hàm thuần | `lib/` | Không JSX |

**Ngưỡng tách component:** dùng ở màn thứ hai. Chép chuỗi `className` dài lần
thứ hai là lúc phải tách.

### Import

Dùng alias `@/`:

```tsx
import Board from "@/components/ui/Board";   // đúng
import Board from "../../components/ui/Board"; // tránh
```

Thứ tự: thư viện ngoài → `@/components` → `@/lib`. ESLint đang canh.

### Style

- **Tailwind trước, CSS sau.** Chỉ đưa vào `globals.css` khi đó là mẫu lặp lại
  toàn app (`.panel`, `.card-sign`, `.press`).
- **Dùng token màu, không dùng mã hex trong JSX.** `bg-sign` chứ không
  `bg-[#FFCE2E]`. Ngoại lệ duy nhất là hằng màu cho Recharts (thư viện cần
  chuỗi màu thật), khai báo ở đầu file và ghi chú rõ.
- **Dùng class chuẩn của Tailwind** khi có: `tracking-widest` thay
  `tracking-[0.1em]`, `size-5.5` thay `size-[22px]`. IDE có cảnh báo
  `suggestCanonicalClasses`.
- **Tiền và đơn vị dùng `.disp-num`**, cột số thêm `.num` —
  [03 · Hệ thống thiết kế](./03-he-thong-thiet-ke.md#ba-lớp-tiện-ích).

### TypeScript

- Interface bắt đầu bằng `I` (`IDayPlan`, `IStore`) cho khớp quy ước backend.
- Kiểu response API khai ở [`lib/types.ts`](../lib/types.ts), **giữ đồng bộ
  thủ công với backend** — chưa sinh tự động, xem
  [09 · Vấn đề đã biết](./09-van-de-da-biet.md).
- Tránh `any`. Cần bóc kiểu từ thư viện ngoài thì ép về kiểu cụ thể của mình
  (xem cách `renderSpendBar` xử lý `payload` của Recharts).

### React

- Mọi page là `"use client"`.
- **Không gọi `setState` thẳng trong thân `useEffect`** — rule
  `react-hooks/set-state-in-effect` sẽ chặn. Có hai cách đúng:
  - Trạng thái đến từ hệ thống ngoài (giờ máy, `matchMedia`) →
    `useSyncExternalStore`.
  - Trạng thái đến từ callback bất đồng bộ (định vị, `setTimeout`) → gọi
    `setState` **trong callback**, không phải trong thân effect.
- Dữ liệu máy chủ để trong TanStack Query, **không sao vào `useState`**.

### Nội dung chữ

Chữ trên giao diện cũng là chất liệu thiết kế:

| Nguyên tắc | Đúng | Sai |
|---|---|---|
| Nói việc sẽ xảy ra | "Đánh dấu" | "OK" |
| Lỗi nói cách sửa | "Email hoặc mật khẩu chưa đúng." | "Đăng nhập thất bại" |
| Trạng thái rỗng chỉ bước tiếp | "Bấm 'Tạo ngày này' — app sẽ chọn món đủ đạm mà vẫn trong hạn mức." | "Không có dữ liệu" |
| Gọi theo cách người dùng gọi | "Đi chợ" | "Quản lý cửa hàng" |

Không xin lỗi, không dùng chữ chung chung, không thán từ.

### Tiếp cận

- Icon mang nghĩa phải có `title`; icon trang trí để `aria-hidden`.
- Trạng thái không được truyền tải **chỉ bằng màu** — `Banner` luôn kèm icon,
  chú giải biểu đồ luôn kèm nhãn chữ.
- Nút có `aria-pressed`, tab có `role="tab"` + `aria-selected` (đã nằm sẵn
  trong `Chip` và `Segmented`).
- Viền focus vàng dày 3px đặt toàn cục trong `globals.css` — **đừng tắt nó đi**.
- Biểu đồ luôn có bảng số đi kèm cho người không đọc được biểu đồ.

---

## Kiểm thử

### Hiện có

| Loại | Tình trạng |
|---|---|
| Lint | `npm run lint` — ESLint kèm `eslint-config-next` |
| Kiểu | `npx tsc --noEmit` |
| Build | `npm run build` — chạy TypeScript check bên trong |
| Test tự động | **Chưa có** |
| Kiểm tra bằng mắt | Thủ công ở 375 / 820 / 1440px |

Chưa có test tự động là nợ kỹ thuật đã ghi nhận. Thứ tự nên bổ sung:

1. **Vitest cho `lib/format.ts`** — hàm thuần, rẻ nhất, `formatVnd` và
   `formatDistance` có quy tắc tách nghìn và dấu phẩy dễ sai.
2. **Testing Library cho `Meter` và `Button`** — kiểm ngưỡng vượt mục tiêu và
   ba trạng thái nút.
3. **Playwright cho một luồng E2E**: đăng ký → onboarding → tạo thực đơn →
   đánh dấu → thấy số liệu đổi.

### Trước khi mở pull request

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Rồi kiểm bằng mắt:

- [ ] Ba mốc 375 / 820 / 1440px, không có cuộn ngang ở mốc nào
- [ ] Trạng thái tải, rỗng, lỗi của mọi phần dữ liệu mới
- [ ] Đi được bằng bàn phím, viền focus luôn nhìn thấy
- [ ] Tiền hiện `đ` thường, không phải `Đ` hoa
- [ ] Không có emoji lọt vào chỗ đáng lẽ là icon
