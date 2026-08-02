import { AuditAction, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import prisma from '@src/repos/prisma';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  UNKNOWN_MODEL: 'Không có bảng này',
  NOT_FOUND: 'Không tìm thấy bản ghi',
  NO_WRITABLE_FIELD: 'Không có trường nào hợp lệ để ghi',
  READ_ONLY: 'Bảng này chỉ đọc, không sửa được',
} as const;

/** Trường lưu dạng băm: nhận mật khẩu thô rồi tự băm, không bao giờ trả ra. */
const SECRET_FIELDS = new Set(['passwordHash']);

/** Bảng chỉ được xem. Nhật ký mà sửa được thì không còn là nhật ký. */
const READ_ONLY_MODELS = new Set(['AdminAuditLog']);

const SALT_ROUNDS = 10;
const MAX_PAGE_SIZE = 100;
const MAX_OPTIONS = 200;
/** Số bản ghi liên quan hiện sẵn ở trang chi tiết trước khi phải bấm xem tất cả. */
const RELATED_PREVIEW = 10;

/** Cột dùng làm nhãn khi chọn khoá ngoại, xét theo thứ tự này. */
const LABEL_CANDIDATES = ['name', 'productName', 'email', 'title', 'label'];

/** Nhãn tiếng Việt cho từng bảng; thiếu thì dùng luôn tên model. */
const MODEL_LABELS: Record<string, string> = {
  User: 'Người dùng',
  Profile: 'Hồ sơ',
  Ingredient: 'Nguyên liệu',
  Store: 'Cửa hàng',
  IngredientPrice: 'Giá nguyên liệu',
  Dish: 'Món ăn',
  DishIngredient: 'Nguyên liệu của món',
  MealPlan: 'Thực đơn',
  MealPlanItem: 'Bữa trong thực đơn',
  MealLog: 'Nhật ký ăn',
  AdminAuditLog: 'Nhật ký quản trị',
};

/******************************************************************************
                                Types
******************************************************************************/

export interface IAdminActor {
  id: number;
  email: string;
}

export interface IAdminField {
  name: string;
  /** scalar | enum */
  kind: string;
  /** Int, String, DateTime, hoặc tên enum */
  type: string;
  isId: boolean;
  isRequired: boolean;
  isList: boolean;
  hasDefault: boolean;
  /** Chỉ có với kind = enum */
  enumValues?: string[];
  /** Cột này là khoá ngoại trỏ tới bảng nào */
  relatedModel?: string;
  /** Trường bí mật: nhập mật khẩu thô, hệ thống tự băm */
  isSecret: boolean;
  /** Sinh tự động (id, createdAt…) nên không cho sửa */
  readOnly: boolean;
}

export interface IAdminModel {
  name: string;
  label: string;
  idField: string;
  fields: IAdminField[];
  /** Trường String dùng để tìm kiếm */
  searchable: string[];
  /** Cả bảng chỉ đọc */
  readOnlyModel: boolean;
}

export interface IAdminOption {
  value: number | string;
  label: string;
}

/** Nhãn đọc được của các khoá ngoại: { tênCột: { id: nhãn } } */
export type IRefLabels = Record<string, Record<string, string>>;

/** Một nhóm bản ghi trỏ ngược về bản ghi đang xem. */
export interface IRelatedGroup {
  model: string;
  label: string;
  /** Cột khoá ngoại bên bảng kia trỏ về đây */
  foreignKey: string;
  idField: string;
  fields: IAdminField[];
  rows: Record<string, unknown>[];
  refLabels: IRefLabels;
  total: number;
}

/******************************************************************************
                                Helpers
******************************************************************************/

const enumsByName = new Map(
  Prisma.dmmf.datamodel.enums.map((e) => [e.name, e.values.map((v) => v.name)]),
);

/**
 * Với mỗi bảng: cột khoá ngoại nào trỏ tới bảng nào.
 * DMMF mô tả quan hệ ở field kiểu object, kèm relationFromFields là cột thật.
 */
const relationsByModel = new Map<string, Record<string, string>>(
  Prisma.dmmf.datamodel.models.map((m) => {
    const rel: Record<string, string> = {};
    for (const f of m.fields) {
      if (f.kind === 'object' && f.relationFromFields?.length === 1) {
        rel[f.relationFromFields[0]] = f.type;
      }
    }
    return [m.name, rel];
  }),
);

/**
 * Chiều ngược lại: bản ghi của bảng nào đang trỏ về bảng này.
 * Dùng để trang chi tiết của Món ăn liệt kê được nguyên liệu của nó.
 */
const reverseByModel = new Map<
  string,
  { model: string; label: string; foreignKey: string }[]
>();
for (const m of Prisma.dmmf.datamodel.models) {
  for (const f of m.fields) {
    if (f.kind === 'object' && f.relationFromFields?.length === 1) {
      const list = reverseByModel.get(f.type) ?? [];
      list.push({
        model: m.name,
        label: MODEL_LABELS[m.name] ?? m.name,
        foreignKey: f.relationFromFields[0],
      });
      reverseByModel.set(f.type, list);
    }
  }
}

/** Delegate của Prisma đặt tên camelCase: IngredientPrice -> ingredientPrice. */
function delegateKey(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

type Delegate = {
  findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
  findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  count: (args?: unknown) => Promise<number>;
  create: (args: unknown) => Promise<Record<string, unknown>>;
  update: (args: unknown) => Promise<Record<string, unknown>>;
  delete: (args: unknown) => Promise<Record<string, unknown>>;
};

/**
 * Chỉ nhận đúng tên model có trong schema — chặn việc gọi bừa thuộc tính
 * của prisma client qua URL.
 */
function resolveModel(name: string): {
  meta: IAdminModel;
  delegate: Delegate;
} {
  const dmmf = Prisma.dmmf.datamodel.models.find((m) => m.name === name);
  if (!dmmf) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.UNKNOWN_MODEL);
  }
  const delegate = (prisma as unknown as Record<string, Delegate>)[
    delegateKey(name)
  ];
  return { meta: describe(dmmf), delegate };
}

/** Chặn ghi vào bảng chỉ đọc. */
function assertWritable(meta: IAdminModel) {
  if (meta.readOnlyModel) {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, Errors.READ_ONLY);
  }
}

type DmmfModel = (typeof Prisma.dmmf.datamodel.models)[number];

function describe(dmmf: DmmfModel): IAdminModel {
  const relations = relationsByModel.get(dmmf.name) ?? {};
  const readOnlyModel = READ_ONLY_MODELS.has(dmmf.name);
  const fields: IAdminField[] = dmmf.fields
    // bỏ quan hệ: admin thao tác trực tiếp trên khoá ngoại (userId, dishId…)
    .filter((f) => f.kind === 'scalar' || f.kind === 'enum')
    .map((f) => ({
      name: f.name,
      kind: f.kind,
      type: f.type,
      isId: !!f.isId,
      isRequired: f.isRequired,
      isList: f.isList,
      hasDefault: f.hasDefaultValue ?? false,
      enumValues: f.kind === 'enum' ? enumsByName.get(f.type) : undefined,
      relatedModel: relations[f.name],
      isSecret: SECRET_FIELDS.has(f.name),
      readOnly:
        readOnlyModel ||
        !!f.isId ||
        f.name === 'createdAt' ||
        f.name === 'updatedAt' ||
        f.name === 'crawledAt',
    }));
  const idField = fields.find((f) => f.isId)?.name ?? 'id';
  return {
    name: dmmf.name,
    label: MODEL_LABELS[dmmf.name] ?? dmmf.name,
    idField,
    fields,
    searchable: fields
      .filter((f) => f.type === 'String' && !f.isList && !f.isSecret)
      .map((f) => f.name),
    readOnlyModel,
  };
}

/** Cột dùng làm nhãn cho bảng này, nếu có. */
function labelFieldOf(meta: IAdminModel): string | undefined {
  return LABEL_CANDIDATES.find((c) =>
    meta.fields.some((f) => f.name === c && f.type === 'String'),
  );
}

/**
 * Đổi id khoá ngoại thành nhãn đọc được.
 * Gom id theo từng bảng rồi truy vấn một lần — không lặp query theo từng dòng.
 */
async function refLabelsFor(
  meta: IAdminModel,
  rows: Record<string, unknown>[],
): Promise<IRefLabels> {
  const out: IRefLabels = {};
  if (rows.length === 0) return out;

  for (const field of meta.fields) {
    if (!field.relatedModel) continue;
    const ids = [
      ...new Set(
        rows
          .map((r) => r[field.name])
          .filter((v): v is number | string => v !== null && v !== undefined),
      ),
    ];
    if (ids.length === 0) continue;

    const target = resolveModel(field.relatedModel);
    const labelField = labelFieldOf(target.meta);
    const found = await target.delegate.findMany({
      where: { [target.meta.idField]: { in: ids } },
    });

    const map: Record<string, string> = {};
    for (const r of found) {
      const id = String(r[target.meta.idField]);
      const raw = labelField ? r[labelField] : null;
      map[id] = typeof raw === 'string' && raw !== '' ? raw : `#${id}`;
    }
    out[field.name] = map;
  }
  return out;
}

/** Ép giá trị từ JSON về đúng kiểu cột. */
function coerce(field: IAdminField, raw: unknown): unknown {
  if (raw === null || raw === '') return null;
  if (field.isList) {
    // Form gửi lên chuỗi ngăn bằng dấu phẩy; API có thể gửi thẳng mảng.
    const arr = Array.isArray(raw)
      ? raw
      : typeof raw === 'string'
        ? raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [raw];
    return arr.map((v) => coerceScalar(field, v));
  }
  return coerceScalar(field, raw);
}

function coerceScalar(field: IAdminField, raw: unknown): unknown {
  switch (field.type) {
    case 'Int': {
      const n = Number(raw);
      if (!Number.isInteger(n)) {
        throw new RouteError(
          HttpStatusCodes.BAD_REQUEST,
          `Trường "${field.name}" phải là số nguyên`,
        );
      }
      return n;
    }
    case 'Float':
    case 'Decimal': {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        throw new RouteError(
          HttpStatusCodes.BAD_REQUEST,
          `Trường "${field.name}" phải là số`,
        );
      }
      return n;
    }
    case 'Boolean':
      return raw === true || raw === 'true';
    case 'DateTime': {
      const d = new Date(String(raw));
      if (Number.isNaN(d.getTime())) {
        throw new RouteError(
          HttpStatusCodes.BAD_REQUEST,
          `Trường "${field.name}" không phải ngày hợp lệ`,
        );
      }
      return d;
    }
    default: {
      if (
        typeof raw !== 'string' &&
        typeof raw !== 'number' &&
        typeof raw !== 'boolean'
      ) {
        throw new RouteError(
          HttpStatusCodes.BAD_REQUEST,
          `Trường "${field.name}" phải là chuỗi`,
        );
      }
      const value = String(raw);
      if (field.kind === 'enum') {
        const allowed = field.enumValues ?? [];
        if (!allowed.includes(value)) {
          throw new RouteError(
            HttpStatusCodes.BAD_REQUEST,
            `Trường "${field.name}" phải là một trong: ${allowed.join(', ')}`,
          );
        }
      }
      return value;
    }
  }
}

/** Lọc body xuống đúng các cột được phép ghi, kèm ép kiểu và băm mật khẩu. */
async function sanitize(
  meta: IAdminModel,
  body: Record<string, unknown>,
  { forCreate }: { forCreate: boolean },
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};
  for (const field of meta.fields) {
    if (field.readOnly) continue;
    if (!(field.name in body)) continue;

    const raw = body[field.name];

    // Mật khẩu: nhận chuỗi thô rồi băm. Bỏ trống nghĩa là giữ nguyên giá trị
    // cũ, không phải xoá — xoá hash đi thì tài khoản thành không đăng nhập
    // được mà chẳng có thông báo nào.
    if (field.isSecret) {
      if (typeof raw !== 'string' || raw === '') continue;
      data[field.name] = await bcrypt.hash(raw, SALT_ROUNDS);
      continue;
    }

    const value = coerce(field, raw);
    // Bỏ trống một cột bắt buộc thì để Prisma/DB tự báo, trừ lúc tạo mới
    // mà cột đó có default — khi ấy bỏ hẳn khỏi payload.
    if (value === null && forCreate && field.hasDefault) continue;
    data[field.name] = value;
  }
  if (Object.keys(data).length === 0) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.NO_WRITABLE_FIELD);
  }
  return data;
}

/** Không bao giờ trả hash mật khẩu ra ngoài, kể cả trong nhật ký. */
function mask(
  meta: IAdminModel,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...row };
  for (const field of meta.fields) {
    if (field.isSecret && out[field.name] != null) out[field.name] = '••••••';
  }
  return out;
}

function parseId(meta: IAdminModel, raw: string): number | string {
  const idField = meta.fields.find((f) => f.name === meta.idField);
  if (idField?.type === 'Int') {
    const n = Number(raw);
    if (!Number.isInteger(n)) {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'id không hợp lệ');
    }
    return n;
  }
  return raw;
}

/** Ghi vết một thao tác. Lỗi ghi nhật ký không được làm hỏng thao tác chính. */
async function audit(
  actor: IAdminActor,
  action: AuditAction,
  model: string,
  recordId: unknown,
  changes: Prisma.InputJsonValue,
): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        action,
        model,
        recordId: String(recordId),
        changes,
      },
    });
  } catch {
    // nuốt lỗi: mất một dòng nhật ký còn hơn chặn thao tác đã thành công
  }
}

/** Chỉ giữ những cột thật sự đổi, để nhật ký đọc được. */
function diff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { truoc: Record<string, unknown>; sau: Record<string, unknown> } {
  const truoc: Record<string, unknown> = {};
  const sau: Record<string, unknown> = {};
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      truoc[key] = before[key] ?? null;
      sau[key] = after[key];
    }
  }
  return { truoc, sau };
}

/******************************************************************************
                                Functions
******************************************************************************/

/** Danh sách bảng kèm số bản ghi, cho màn tổng quan. */
async function listModels(): Promise<(IAdminModel & { count: number })[]> {
  const models = Prisma.dmmf.datamodel.models.map(describe);
  return Promise.all(
    models.map(async (meta) => {
      const delegate = (prisma as unknown as Record<string, Delegate>)[
        delegateKey(meta.name)
      ];
      return { ...meta, count: await delegate.count() };
    }),
  );
}

interface IListOptions {
  page: number;
  pageSize: number;
  q?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  /** Lọc theo một cột, dùng cho "xem tất cả bản ghi liên quan" */
  filterField?: string;
  filterValue?: string;
}

async function list(modelName: string, opts: IListOptions) {
  const { meta, delegate } = resolveModel(modelName);
  const pageSize = Math.min(Math.max(opts.pageSize, 1), MAX_PAGE_SIZE);
  const page = Math.max(opts.page, 1);

  const conditions: Record<string, unknown>[] = [];
  if (opts.q && meta.searchable.length > 0) {
    conditions.push({
      OR: meta.searchable.map((f) => ({
        [f]: { contains: opts.q, mode: 'insensitive' },
      })),
    });
  }
  // Chỉ lọc theo đúng cột có thật, tránh nhận tên cột tuỳ ý từ URL.
  const filterField = meta.fields.find((f) => f.name === opts.filterField);
  if (filterField && opts.filterValue !== undefined) {
    conditions.push({
      [filterField.name]: coerce(filterField, opts.filterValue),
    });
  }
  const where = conditions.length ? { AND: conditions } : undefined;

  const sortBy = meta.fields.some((f) => f.name === opts.sortBy)
    ? opts.sortBy!
    : meta.idField;
  const sortDir = opts.sortDir === 'asc' ? 'asc' : 'desc';

  const [rows, total] = await Promise.all([
    delegate.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortDir },
    }),
    delegate.count({ where }),
  ]);

  const masked = rows.map((r) => mask(meta, r));
  return {
    model: meta,
    rows: masked,
    refLabels: await refLabelsFor(meta, masked),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

/**
 * Danh sách để chọn khoá ngoại: id kèm một nhãn đọc được.
 * Bảng lớn thì lọc bằng q, và luôn cắt ở MAX_OPTIONS.
 */
async function options(
  modelName: string,
  q?: string,
): Promise<{ options: IAdminOption[]; truncated: boolean; total: number }> {
  const { meta, delegate } = resolveModel(modelName);
  const labelField = LABEL_CANDIDATES.find((c) =>
    meta.fields.some((f) => f.name === c && f.type === 'String'),
  );

  const where =
    q && labelField
      ? { [labelField]: { contains: q, mode: 'insensitive' } }
      : undefined;

  const [rows, total] = await Promise.all([
    delegate.findMany({
      where,
      take: MAX_OPTIONS,
      orderBy: labelField
        ? { [labelField]: 'asc' }
        : { [meta.idField]: 'asc' },
    }),
    delegate.count({ where }),
  ]);

  return {
    options: rows.map((r) => {
      const id = r[meta.idField] as number | string;
      const rawLabel = labelField ? r[labelField] : null;
      const label = typeof rawLabel === 'string' ? rawLabel : '';
      return { value: id, label: label ? `${label} · #${id}` : `#${id}` };
    }),
    truncated: total > MAX_OPTIONS,
    total,
  };
}

/**
 * Chi tiết một bản ghi: các cột của chính nó, nhãn cho khoá ngoại, và mọi
 * bản ghi ở bảng khác đang trỏ về nó (nguyên liệu của món, bữa trong thực
 * đơn…).
 */
async function getOne(modelName: string, rawId: string) {
  const { meta, delegate } = resolveModel(modelName);
  const id = parseId(meta, rawId);
  const row = await delegate.findUnique({ where: { [meta.idField]: id } });
  if (!row) throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.NOT_FOUND);

  const masked = mask(meta, row);

  const related: IRelatedGroup[] = await Promise.all(
    (reverseByModel.get(meta.name) ?? []).map(async (rel) => {
      const target = resolveModel(rel.model);
      const where = { [rel.foreignKey]: id };
      const [rows, total] = await Promise.all([
        target.delegate.findMany({
          where,
          take: RELATED_PREVIEW,
          orderBy: { [target.meta.idField]: 'asc' },
        }),
        target.delegate.count({ where }),
      ]);
      const maskedRows = rows.map((r) => mask(target.meta, r));
      return {
        model: rel.model,
        label: rel.label,
        foreignKey: rel.foreignKey,
        idField: target.meta.idField,
        fields: target.meta.fields,
        rows: maskedRows,
        refLabels: await refLabelsFor(target.meta, maskedRows),
        total,
      };
    }),
  );

  return {
    model: meta,
    row: masked,
    refLabels: await refLabelsFor(meta, [masked]),
    related: related.filter((r) => r.total > 0),
  };
}

async function create(
  modelName: string,
  body: Record<string, unknown>,
  actor: IAdminActor,
) {
  const { meta, delegate } = resolveModel(modelName);
  assertWritable(meta);
  const row = await delegate.create({
    data: await sanitize(meta, body, { forCreate: true }),
  });
  const masked = mask(meta, row);
  await audit(
    actor,
    AuditAction.CREATE,
    meta.name,
    row[meta.idField],
    masked as Prisma.InputJsonValue,
  );
  return masked;
}

async function update(
  modelName: string,
  rawId: string,
  body: Record<string, unknown>,
  actor: IAdminActor,
) {
  const { meta, delegate } = resolveModel(modelName);
  assertWritable(meta);
  const id = parseId(meta, rawId);

  const before = await delegate.findUnique({ where: { [meta.idField]: id } });
  if (!before) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.NOT_FOUND);
  }

  const data = await sanitize(meta, body, { forCreate: false });
  const row = await delegate.update({ where: { [meta.idField]: id }, data });

  const masked = mask(meta, row);
  const changes = diff(mask(meta, before), masked);
  // Trường bí mật bị che ở cả hai phía nên diff không thấy khác biệt. Phải
  // ghi nhận riêng, nếu không đổi mật khẩu sẽ để lại một dòng nhật ký rỗng.
  for (const field of meta.fields) {
    if (field.isSecret && field.name in data) {
      changes.truoc[field.name] = '••••••';
      changes.sau[field.name] = '(đã đổi)';
    }
  }

  await audit(
    actor,
    AuditAction.UPDATE,
    meta.name,
    id,
    changes as unknown as Prisma.InputJsonValue,
  );
  return masked;
}

async function remove(modelName: string, rawId: string, actor: IAdminActor) {
  const { meta, delegate } = resolveModel(modelName);
  assertWritable(meta);
  const id = parseId(meta, rawId);

  const before = await delegate.findUnique({ where: { [meta.idField]: id } });
  if (!before) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.NOT_FOUND);
  }
  await delegate.delete({ where: { [meta.idField]: id } });
  await audit(
    actor,
    AuditAction.DELETE,
    meta.name,
    id,
    mask(meta, before) as Prisma.InputJsonValue,
  );
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  Errors,
  listModels,
  list,
  options,
  getOne,
  create,
  update,
  remove,
} as const;
