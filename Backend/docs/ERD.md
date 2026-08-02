# ERD — Cơ sở dữ liệu StudentBites

> Sơ đồ quan hệ **đầy đủ** của toàn bộ bảng. File này sinh tự động từ
> `prisma/schema.prisma`, không viết tay, nên luôn khớp migration mới nhất.

**Sinh ngày:** 2026-08-02 · PostgreSQL 16 · 15 bảng · 16 khoá ngoại · 7 enum

---

## Sơ đồ

```mermaid
erDiagram
    CrawlRun ||--o{ CrawlCategory : "gồm"
    CrawlRun ||--o{ ProductPriceHistory : "quan sát bởi"
    Dish ||--o{ DishIngredient : "gồm"
    Dish ||--o{ MealLog : "món có sẵn, null nếu tự nhập"
    Dish ||--o{ MealPlanItem : "dùng món"
    Ingredient ||--o{ DishIngredient : "dùng"
    Ingredient ||--o{ Product : "là nguyên liệu"
    MealPlan ||--o{ MealPlanItem : "gồm"
    Product ||--o{ ProductPriceHistory : "biến động giá"
    StoreCategory ||--o{ CrawlCategory : "chạy danh mục"
    StoreCategory ||--o{ Product : "thuộc danh mục"
    Store ||--o{ Product : "bán"
    Store ||--o{ StoreCategory : "có danh mục"
    User ||--o{ MealLog : "ghi"
    User ||--o{ MealPlan : "sở hữu"
    User ||--o| Profile : "có một"

    AdminAuditLog {
        int id PK
        int actorId
        string actorEmail
        enum_AuditAction action
        string model
        string recordId
        json changes "nội dung khác nhau theo action"
        datetime createdAt
    }
    CrawlCategory {
        int id PK
        int crawlRunId FK
        int storeCategoryId FK "có thể trống"
        string path
        string url
        int httpStatus "null = lỗi mạng"
        int productsFound
        int durationMs "có thể trống"
        string errorMessage "có thể trống"
    }
    CrawlRun {
        int id PK
        string sourceSite
        datetime startedAt
        datetime finishedAt "có thể trống"
        enum_CrawlStatus status
        int productsFound
        int matched
        int pricesChanged
        string errorMessage "có thể trống"
    }
    Dish {
        int id PK
        string name UK
        string description "có thể trống"
        enum_MealType mealTypes
        float protein
        float carb
        float fat
        float kcal
        int estimatedCost "VND mỗi khẩu phần"
    }
    DishIngredient {
        int id PK
        int dishId FK
        int ingredientId FK
        float amountGrams
    }
    Ingredient {
        int id PK
        string name UK
        string category
        string unit
        float proteinPer100g
        float carbPer100g
        float fatPer100g
        float kcalPer100g
        string_array keywords "để map sản phẩm khi crawl"
    }
    MealLog {
        int id PK
        int userId FK
        datetime date
        enum_MealType mealType
        int dishId FK "null nếu món tự nhập"
        string customName "có thể trống"
        float protein
        float carb
        float fat
        float kcal
        int cost "VND thực chi"
        datetime eatenAt
    }
    MealPlan {
        int id PK
        int userId FK
        datetime date
        datetime createdAt
    }
    MealPlanItem {
        int id PK
        int mealPlanId FK
        enum_MealType mealType
        int dishId FK
        int estimatedCost "chốt lúc tạo plan"
    }
    Product {
        uuid id PK
        int storeId FK
        int storeCategoryId FK "có thể trống"
        string sku "mã trên sàn"
        string name
        string url "có thể trống"
        string imageUrl "có thể trống"
        decimal currentPrice "có thể trống"
        bool isInStock
        string rawUnit "thô từ web: 300g / 0.5KG / Gói"
        int baseWeightGrams "null = chưa đọc được"
        decimal pricePerGram "tính sẵn để so giá"
        json metadata "phần riêng của từng sàn"
        int ingredientId FK "null = chưa map"
        enum_MatchSource matchSource
        string matchedKeyword "có thể trống"
        datetime firstSeenAt
        datetime lastSeenAt "không thấy nữa = sàn đã gỡ"
        datetime createdAt
        datetime updatedAt
    }
    ProductPriceHistory {
        int id PK
        string productId FK
        decimal price
        bool isInStock
        int crawlRunId FK "có thể trống"
        datetime recordedAt
    }
    Profile {
        int id PK
        int userId FK
        float heightCm
        float weightKg
        int age
        string gender
        enum_ActivityLevel activityLevel
        enum_Goal goal
        int monthlyBudget "VND"
        datetime updatedAt
    }
    Store {
        int id PK
        string name
        enum_StoreType type
        string address "có thể trống"
        float lat "có thể trống"
        float lng "có thể trống"
        string sourceSite "có thể trống"
        string code UK "định danh nguồn crawl"
        string osmId UK "id OpenStreetMap"
    }
    StoreCategory {
        int id PK
        int storeId FK
        string path "ví dụ /c/thit-heo"
        string name
        bool isActive "tắt danh mục hỏng mà không xoá"
        datetime lastOkAt "có thể trống"
        int lastStatus "mã HTTP lần chạy cuối"
        string note "có thể trống"
    }
    User {
        int id PK
        string email UK
        string passwordHash
        string name
        datetime createdAt
    }
```

---

## Các bảng theo nhóm

### Người dùng

| Bảng | Dòng | Vai trò |
|---|---:|---|
| `User` | 1 | Tài khoản đăng nhập |
| `Profile` | 1 | Thể trạng, mục tiêu, ngân sách tháng — mỗi người một hồ sơ |

### Danh mục món ăn

| Bảng | Dòng | Vai trò |
|---|---:|---|
| `Ingredient` | 29 | Nguyên liệu ở mức khái niệm nấu ăn, macro trên 100g |
| `Dish` | 26 | Món ăn, macro và giá tính sẵn cho một khẩu phần |
| `DishIngredient` | 79 | Định lượng nguyên liệu của từng món |

### Hoạt động hằng ngày

| Bảng | Dòng | Vai trò |
|---|---:|---|
| `MealPlan` | 8 | Thực đơn một ngày của một người |
| `MealPlanItem` | 32 | Một bữa trong thực đơn |
| `MealLog` | 22 | Bữa đã ăn — ảnh chụp macro và chi phí tại thời điểm đó |

### Hàng hoá & giá

| Bảng | Dòng | Vai trò |
|---|---:|---|
| `Store` | 150 | 3 nguồn crawl (ONLINE) + phần còn lại lấy từ OpenStreetMap |
| `StoreCategory` | 19 | Danh mục từng sàn — đường dẫn crawl, sửa được trên admin |
| `Product` | 84 | Sản phẩm có thật trên kệ. **Giá luôn thuộc về đây** |
| `ProductPriceHistory` | 0 | Diễn biến giá, chỉ ghi khi giá hoặc tình trạng đổi |

### Vận hành crawl

| Bảng | Dòng | Vai trò |
|---|---:|---|
| `CrawlRun` | 0 | Một lượt crawl của một nguồn |
| `CrawlCategory` | 0 | Kết quả từng danh mục — nơi trả lời "đường dẫn nào 404" |

### Quản trị

| Bảng | Dòng | Vai trò |
|---|---:|---|
| `AdminAuditLog` | 2 | Nhật ký thao tác khu quản trị, chỉ đọc |

---

## Enum

| Enum | Giá trị |
|---|---|
| `ActivityLevel` | `SEDENTARY` · `LIGHT` · `MODERATE` · `ACTIVE` · `VERY_ACTIVE` |
| `AuditAction` | `CREATE` · `UPDATE` · `DELETE` |
| `CrawlStatus` | `RUNNING` · `SUCCESS` · `PARTIAL` · `FAILED` |
| `Goal` | `GAIN_MUSCLE` · `LOSE_FAT` · `MAINTAIN` |
| `MatchSource` | `NONE` · `AUTO_KEYWORD` · `MANUAL` |
| `MealType` | `BREAKFAST` · `LUNCH` · `DINNER` · `SNACK` |
| `StoreType` | `MARKET` · `SUPERMARKET` · `CONVENIENCE` · `ONLINE` |

---

## Ràng buộc duy nhất

| Bảng | Cột | Vì sao |
|---|---|---|
| `Dish` | `name` | Seed chạy lại không nhân bản |
| `DishIngredient` | `dishId, ingredientId` | Một món không lặp nguyên liệu |
| `Ingredient` | `name` | Seed chạy lại không nhân bản |
| `MealPlan` | `userId, date` | Một người một ngày một thực đơn — tạo lại là ghi đè |
| `Product` | `storeId, sku` | Crawl lại cập nhật đúng dòng cũ, không sinh bản sao |
| `Profile` | `userId` | Mỗi người đúng một hồ sơ |
| `Store` | `code` | Định danh ổn định của nguồn crawl |
| `Store` | `osmId` | Khoá upsert khi cache kết quả Overpass |
| `StoreCategory` | `storeId, path` | Một sàn không có hai danh mục cùng đường dẫn |
| `User` | `email` | Email là danh tính đăng nhập |

---

## Xoá lan

| Khi xoá | Kéo theo |
|---|---|
| `CrawlRun` | xoá luôn `CrawlCategory` · gỡ liên kết ở `ProductPriceHistory` |
| `Dish` | xoá luôn `DishIngredient` · gỡ liên kết ở `MealLog` · **bị chặn** nếu còn `MealPlanItem` |
| `Ingredient` | xoá luôn `DishIngredient` · gỡ liên kết ở `Product` |
| `MealPlan` | xoá luôn `MealPlanItem` |
| `Product` | xoá luôn `ProductPriceHistory` |
| `Store` | xoá luôn `Product`, `StoreCategory` |
| `StoreCategory` | gỡ liên kết ở `CrawlCategory`, `Product` |
| `User` | xoá luôn `MealLog`, `MealPlan`, `Profile` |

---

## Sinh lại file này

```bash
cd Backend && npm run docs:erd
```

Thêm migration xong thì chạy lệnh trên rồi commit đè lên. **Đừng sửa tay**
từng dòng — lần sinh sau sẽ ghi đè mất.

Bản ERD rút gọn chỉ gồm phần nghiệp vụ chính nằm ở
[03 · Mô hình dữ liệu](./03-mo-hinh-du-lieu.md); file này là bản đầy đủ,
có cả bảng vận hành crawl và quản trị.
