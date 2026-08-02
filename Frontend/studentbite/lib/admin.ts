// Kiểu dữ liệu của khu quản trị, khớp với AdminService phía backend.

export interface IAdminField {
  name: string;
  kind: "scalar" | "enum";
  type: string;
  isId: boolean;
  isRequired: boolean;
  isList: boolean;
  hasDefault: boolean;
  enumValues?: string[];
  /** Cột này là khoá ngoại trỏ tới bảng nào */
  relatedModel?: string;
  isSecret: boolean;
  readOnly: boolean;
}

export interface IAdminModel {
  name: string;
  label: string;
  idField: string;
  fields: IAdminField[];
  searchable: string[];
  readOnlyModel: boolean;
}

export interface IAdminOption {
  value: number | string;
  label: string;
}

export interface IAdminOptions {
  options: IAdminOption[];
  truncated: boolean;
  total: number;
}

export type IAdminModelWithCount = IAdminModel & { count: number };

export type IAdminRow = Record<string, unknown>;

/** Nhãn đọc được của khoá ngoại: { tênCột: { id: nhãn } } */
export type IRefLabels = Record<string, Record<string, string>>;

export interface IAdminList {
  model: IAdminModel;
  rows: IAdminRow[];
  refLabels: IRefLabels;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Nhóm bản ghi ở bảng khác đang trỏ về bản ghi đang xem. */
export interface IRelatedGroup {
  model: string;
  label: string;
  foreignKey: string;
  idField: string;
  fields: IAdminField[];
  rows: IAdminRow[];
  refLabels: IRefLabels;
  total: number;
}

export interface IAdminDetail {
  model: IAdminModel;
  row: IAdminRow;
  refLabels: IRefLabels;
  related: IRelatedGroup[];
}

/** Nhãn của một khoá ngoại, lùi về #id nếu chưa giải được. */
export function refLabel(
  refLabels: IRefLabels | undefined,
  field: string,
  value: unknown,
): string {
  const id = String(value);
  return refLabels?.[field]?.[id] ?? `#${id}`;
}

/** Ô nhập nào cho kiểu nào. */
export type FieldInput =
  | "relation"
  | "select"
  | "boolean"
  | "date"
  | "number"
  | "textarea"
  | "text";

export function inputKindOf(field: IAdminField): FieldInput {
  if (field.relatedModel) return "relation";
  if (field.kind === "enum") return "select";
  if (field.type === "Boolean") return "boolean";
  if (field.type === "DateTime") return "date";
  if (field.isList) return "textarea";
  if (["Int", "Float", "Decimal"].includes(field.type)) return "number";
  return "text";
}

/** Hiển thị một giá trị bất kỳ trong ô bảng. */
export function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  // Cột Json (nhật ký quản trị) — hiện gọn để bảng không vỡ, xem đủ ở tooltip
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "có" : "không";
  if (typeof value === "string") {
    // ISO date -> đọc được
    const isoDate = /^\d{4}-\d{2}-\d{2}T/.test(value);
    if (isoDate) {
      const d = new Date(value);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }
    return value;
  }
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  return String(value);
}

/** Giá trị trong form: mọi thứ về chuỗi để <input> điều khiển được. */
export function toFormValue(field: IAdminField, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (field.type === "DateTime" && typeof value === "string") {
    return value.slice(0, 10); // YYYY-MM-DD cho <input type="date">
  }
  return String(value);
}
