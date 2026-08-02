/**
 * Sinh docs/ERD.md từ Prisma DMMF (không viết tay).
 *
 * Chạy: npm run docs:erd
 *
 * Số dòng của từng bảng lấy từ database nếu kết nối được; không kết nối được
 * thì vẫn sinh sơ đồ, chỉ bỏ trống cột số dòng.
 */
import { Prisma, PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/******************************************************************************
                                Constants
******************************************************************************/

const OUT = path.join(__dirname, '..', 'docs', 'ERD.md');

/** Nhóm bảng theo vai trò nghiệp vụ. Bảng thiếu ở đây rơi vào "Khác". */
const GROUPS: { title: string; tables: string[] }[] = [
  { title: 'Người dùng', tables: ['User', 'Profile'] },
  { title: 'Danh mục món ăn', tables: ['Ingredient', 'Dish', 'DishIngredient'] },
  {
    title: 'Hoạt động hằng ngày',
    tables: ['MealPlan', 'MealPlanItem', 'MealLog'],
  },
  {
    title: 'Hàng hoá & giá',
    tables: ['Store', 'StoreCategory', 'Product', 'ProductPriceHistory'],
  },
  { title: 'Vận hành crawl', tables: ['CrawlRun', 'CrawlCategory'] },
  { title: 'Quản trị', tables: ['AdminAuditLog'] },
];

const DESC: Record<string, string> = {
  User: 'Tài khoản đăng nhập',
  Profile: 'Thể trạng, mục tiêu, ngân sách tháng — mỗi người một hồ sơ',
  Ingredient: 'Nguyên liệu ở mức khái niệm nấu ăn, macro trên 100g',
  Dish: 'Món ăn, macro và giá tính sẵn cho một khẩu phần',
  DishIngredient: 'Định lượng nguyên liệu của từng món',
  Store: '3 nguồn crawl (ONLINE) + phần còn lại lấy từ OpenStreetMap',
  StoreCategory: 'Danh mục từng sàn — đường dẫn crawl, sửa được trên admin',
  Product: 'Sản phẩm có thật trên kệ. **Giá luôn thuộc về đây**',
  ProductPriceHistory: 'Diễn biến giá, chỉ ghi khi giá hoặc tình trạng đổi',
  CrawlRun: 'Một lượt crawl của một nguồn',
  CrawlCategory: 'Kết quả từng danh mục — nơi trả lời "đường dẫn nào 404"',
  MealPlan: 'Thực đơn một ngày của một người',
  MealPlanItem: 'Một bữa trong thực đơn',
  MealLog: 'Bữa đã ăn — ảnh chụp macro và chi phí tại thời điểm đó',
  AdminAuditLog: 'Nhật ký thao tác khu quản trị, chỉ đọc',
};

/** Ghi chú cho cột cần giải thích. */
const NOTE: Record<string, string> = {
  'Store.code': 'định danh nguồn crawl',
  'Store.osmId': 'id OpenStreetMap',
  'Ingredient.keywords': 'để map sản phẩm khi crawl',
  'Product.sku': 'mã trên sàn',
  'Product.rawUnit': 'thô từ web: 300g / 0.5KG / Gói',
  'Product.baseWeightGrams': 'null = chưa đọc được',
  'Product.pricePerGram': 'tính sẵn để so giá',
  'Product.metadata': 'phần riêng của từng sàn',
  'Product.ingredientId': 'null = chưa map',
  'Product.lastSeenAt': 'không thấy nữa = sàn đã gỡ',
  'StoreCategory.path': 'ví dụ /c/thit-heo',
  'StoreCategory.isActive': 'tắt danh mục hỏng mà không xoá',
  'StoreCategory.lastStatus': 'mã HTTP lần chạy cuối',
  'CrawlCategory.httpStatus': 'null = lỗi mạng',
  'AdminAuditLog.changes': 'nội dung khác nhau theo action',
  'MealPlanItem.estimatedCost': 'chốt lúc tạo plan',
  'MealLog.cost': 'VND thực chi',
  'MealLog.dishId': 'null nếu món tự nhập',
  'Dish.estimatedCost': 'VND mỗi khẩu phần',
  'Profile.monthlyBudget': 'VND',
};

const UNIQUE_WHY: Record<string, string> = {
  'User.email': 'Email là danh tính đăng nhập',
  'Profile.userId': 'Mỗi người đúng một hồ sơ',
  'Ingredient.name': 'Seed chạy lại không nhân bản',
  'Dish.name': 'Seed chạy lại không nhân bản',
  'Store.code': 'Định danh ổn định của nguồn crawl',
  'Store.osmId': 'Khoá upsert khi cache kết quả Overpass',
  'MealPlan.userId, date': 'Một người một ngày một thực đơn — tạo lại là ghi đè',
  'DishIngredient.dishId, ingredientId': 'Một món không lặp nguyên liệu',
  'Product.storeId, sku': 'Crawl lại cập nhật đúng dòng cũ, không sinh bản sao',
  'StoreCategory.storeId, path': 'Một sàn không có hai danh mục cùng đường dẫn',
};

/** Nhãn quan hệ, khoá là "BảngNhiều.BảngMột". */
const REL_LABEL: Record<string, string> = {
  'Profile.User': 'có một',
  'MealPlan.User': 'sở hữu',
  'MealLog.User': 'ghi',
  'MealPlanItem.MealPlan': 'gồm',
  'MealPlanItem.Dish': 'dùng món',
  'MealLog.Dish': 'món có sẵn, null nếu tự nhập',
  'DishIngredient.Dish': 'gồm',
  'DishIngredient.Ingredient': 'dùng',
  'Product.Store': 'bán',
  'Product.StoreCategory': 'thuộc danh mục',
  'Product.Ingredient': 'là nguyên liệu',
  'StoreCategory.Store': 'có danh mục',
  'ProductPriceHistory.Product': 'biến động giá',
  'ProductPriceHistory.CrawlRun': 'quan sát bởi',
  'CrawlCategory.CrawlRun': 'gồm',
  'CrawlCategory.StoreCategory': 'chạy danh mục',
};

const SCALAR: Record<string, string> = {
  Int: 'int',
  BigInt: 'bigint',
  String: 'string',
  Boolean: 'bool',
  Float: 'float',
  Decimal: 'decimal',
  DateTime: 'datetime',
  Json: 'json',
  Bytes: 'bytes',
};

/******************************************************************************
                                Functions
******************************************************************************/

type Model = (typeof Prisma.dmmf.datamodel.models)[number];

const models = [...Prisma.dmmf.datamodel.models].sort((a, b) =>
  a.name.localeCompare(b.name),
);
const enums = [...Prisma.dmmf.datamodel.enums].sort((a, b) =>
  a.name.localeCompare(b.name),
);

function typeOf(f: Model['fields'][number]): string {
  if (f.kind === 'enum') return `enum_${f.type}`;
  const base = SCALAR[f.type] ?? f.type.toLowerCase();
  // Prisma dùng String @id @default(uuid()) cho Product
  if (f.isId && f.type === 'String') return 'uuid';
  return f.isList ? `${base}_array` : base;
}

function uniqueColumnsOf(m: Model): string[] {
  const out = m.fields.filter((f) => f.isUnique).map((f) => f.name);
  for (const u of m.uniqueFields) out.push(u.join(', '));
  return out;
}

/** Danh sách quan hệ: bảng nhiều -> bảng một, kèm quy tắc xoá. */
function relations() {
  const rels: {
    one: string;
    many: string;
    label: string;
    optional: boolean;
    onDelete: string;
  }[] = [];
  for (const m of models) {
    for (const f of m.fields) {
      if (f.kind !== 'object' || !f.relationFromFields?.length) continue;
      const fkCol = m.fields.find((x) => x.name === f.relationFromFields![0]);
      const optional = !fkCol?.isRequired;
      rels.push({
        one: f.type,
        many: m.name,
        label: REL_LABEL[`${m.name}.${f.type}`] ?? '',
        optional,
        // DMMF chỉ trả relationOnDelete khi schema khai rõ. Không khai thì
        // Prisma mặc định SetNull với khoá ngoại cho phép null, Restrict với
        // khoá bắt buộc — phải suy ra, nếu không bảng "xoá lan" sẽ sai.
        onDelete: String(
          f.relationOnDelete ?? (optional ? 'SetNull' : 'Restrict'),
        ),
      });
    }
  }
  return rels;
}

async function rowCounts(): Promise<Record<string, number> | null> {
  const prisma = new PrismaClient();
  try {
    const out: Record<string, number> = {};
    for (const m of models) {
      const delegate = (
        prisma as unknown as Record<string, { count: () => Promise<number> }>
      )[m.name.charAt(0).toLowerCase() + m.name.slice(1)];
      out[m.name] = await delegate.count();
    }
    return out;
  } catch {
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const rels = relations();
  const counts = await rowCounts();
  const today = new Date().toISOString().slice(0, 10);
  const L: string[] = [];

  L.push('# ERD — Cơ sở dữ liệu StudentBites', '');
  L.push(
    '> Sơ đồ quan hệ **đầy đủ** của toàn bộ bảng. File này sinh tự động từ',
    '> `prisma/schema.prisma`, không viết tay, nên luôn khớp migration mới nhất.',
    '',
  );
  L.push(
    `**Sinh ngày:** ${today} · PostgreSQL 16 · ` +
    `${models.length} bảng · ${rels.length} khoá ngoại · ${enums.length} enum`,
    '',
    '---',
    '',
  );

  // --- sơ đồ ---
  L.push('## Sơ đồ', '', '```mermaid', 'erDiagram');
  const seen = new Set<string>();
  for (const r of [...rels].sort((a, b) =>
    `${a.one}${a.many}`.localeCompare(`${b.one}${b.many}`),
  )) {
    const key = `${r.one}|${r.many}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const card = r.many === 'Profile' ? '||--o|' : '||--o{';
    L.push(`    ${r.one} ${card} ${r.many} : "${r.label}"`);
  }
  L.push('');
  for (const m of models) {
    L.push(`    ${m.name} {`);
    const fkCols = new Set(
      m.fields.flatMap((f) => f.relationFromFields ?? []),
    );
    const uniqueCols = new Set(
      m.fields.filter((f) => f.isUnique).map((f) => f.name),
    );
    for (const f of m.fields) {
      if (f.kind === 'object') continue;
      const tag = f.isId
        ? 'PK'
        : fkCols.has(f.name)
          ? 'FK'
          : uniqueCols.has(f.name)
            ? 'UK'
            : '';
      const note =
        NOTE[`${m.name}.${f.name}`] ?? (f.isRequired ? '' : 'có thể trống');
      const parts = [typeOf(f), f.name];
      if (tag) parts.push(tag);
      if (note) parts.push(`"${note}"`);
      L.push('        ' + parts.join(' '));
    }
    L.push('    }');
  }
  L.push('```', '', '---', '');

  // --- bảng theo nhóm ---
  L.push('## Các bảng theo nhóm', '');
  const grouped = new Set(GROUPS.flatMap((g) => g.tables));
  const others = models.map((m) => m.name).filter((n) => !grouped.has(n));
  const all = [...GROUPS];
  if (others.length) all.push({ title: 'Khác', tables: others });

  for (const g of all) {
    L.push(`### ${g.title}`, '', '| Bảng | Dòng | Vai trò |', '|---|---:|---|');
    for (const t of g.tables) {
      const n = counts ? counts[t].toLocaleString('vi-VN') : '—';
      L.push(`| \`${t}\` | ${n} | ${DESC[t] ?? ''} |`);
    }
    L.push('');
  }
  L.push('---', '');

  // --- enum ---
  L.push('## Enum', '', '| Enum | Giá trị |', '|---|---|');
  for (const e of enums) {
    L.push(`| \`${e.name}\` | ${e.values.map((v) => `\`${v.name}\``).join(' · ')} |`);
  }
  L.push('', '---', '');

  // --- ràng buộc duy nhất ---
  L.push('## Ràng buộc duy nhất', '', '| Bảng | Cột | Vì sao |', '|---|---|---|');
  for (const m of models) {
    for (const u of uniqueColumnsOf(m)) {
      L.push(`| \`${m.name}\` | \`${u}\` | ${UNIQUE_WHY[`${m.name}.${u}`] ?? ''} |`);
    }
  }
  L.push('', '---', '');

  // --- xoá lan ---
  L.push('## Xoá lan', '', '| Khi xoá | Kéo theo |', '|---|---|');
  const byParent = new Map<string, { cascade: string[]; setNull: string[]; block: string[] }>();
  for (const r of rels) {
    const e = byParent.get(r.one) ?? { cascade: [], setNull: [], block: [] };
    if (r.onDelete === 'Cascade') e.cascade.push(r.many);
    else if (r.onDelete === 'SetNull') e.setNull.push(r.many);
    else e.block.push(r.many);
    byParent.set(r.one, e);
  }
  for (const [parent, e] of [...byParent].sort()) {
    const parts: string[] = [];
    const fmt = (a: string[]) => [...new Set(a)].sort().map((x) => `\`${x}\``).join(', ');
    if (e.cascade.length) parts.push(`xoá luôn ${fmt(e.cascade)}`);
    if (e.setNull.length) parts.push(`gỡ liên kết ở ${fmt(e.setNull)}`);
    if (e.block.length) parts.push(`**bị chặn** nếu còn ${fmt(e.block)}`);
    L.push(`| \`${parent}\` | ${parts.join(' · ')} |`);
  }
  L.push('', '---', '');

  L.push(
    '## Sinh lại file này',
    '',
    '```bash',
    'cd Backend && npm run docs:erd',
    '```',
    '',
    'Thêm migration xong thì chạy lệnh trên rồi commit đè lên. **Đừng sửa tay**',
    'từng dòng — lần sinh sau sẽ ghi đè mất.',
    '',
    'Bản ERD rút gọn chỉ gồm phần nghiệp vụ chính nằm ở',
    '[03 · Mô hình dữ liệu](./03-mo-hinh-du-lieu.md); file này là bản đầy đủ,',
    'có cả bảng vận hành crawl và quản trị.',
    '',
  );

  fs.writeFileSync(OUT, L.join('\n'), 'utf8');
  // eslint-disable-next-line no-console -- script CLI, in kết quả ra terminal
  console.log(
    `Đã sinh ${OUT} — ${models.length} bảng, ${rels.length} quan hệ` +
    (counts ? '' : ' (không kết nối được DB nên bỏ trống số dòng)'),
  );
}

void main();
