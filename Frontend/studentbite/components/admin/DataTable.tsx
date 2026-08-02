"use client";

import Link from "next/link";

import {
  displayValue,
  refLabel,
  type IAdminField,
  type IAdminRow,
  type IRefLabels,
} from "@/lib/admin";

interface IProps {
  modelName: string;
  idField: string;
  fields: IAdminField[];
  rows: IAdminRow[];
  refLabels?: IRefLabels;
  /** Nút cuối mỗi dòng; không truyền thì bỏ luôn cột thao tác. */
  actions?: (row: IAdminRow) => React.ReactNode;
  /** Ẩn bớt cột cho bảng liên quan ở trang chi tiết. */
  hideFields?: string[];
}

/**
 * Bảng dữ liệu dùng chung cho màn danh sách và các bảng liên quan ở trang
 * chi tiết. Khoá ngoại hiện tên đọc được và bấm sang được bản ghi đó, thay
 * vì trơ ra một con số.
 */
export default function DataTable({
  modelName,
  idField,
  fields,
  rows,
  refLabels,
  actions,
  hideFields = [],
}: IProps) {
  const cols = fields.filter((f) => !hideFields.includes(f.name));

  return (
    <div className="overflow-x-auto border-2 border-panel/20">
      <table className="w-full border-collapse text-[0.75rem] whitespace-nowrap">
        <thead>
          <tr className="bg-enamel-deep">
            {cols.map((f) => (
              <th
                key={f.name}
                className="label border-b-2 border-panel/20 px-2.5 py-2 text-left text-panel/50"
              >
                {f.name}
              </th>
            ))}
            {actions && (
              <th className="label sticky right-0 border-b-2 border-l-2 border-panel/20 bg-enamel-deep px-2.5 py-2 text-right text-panel/50">
                Thao tác
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = String(row[idField]);
            return (
              <tr
                key={id}
                className="border-b border-panel/10 hover:bg-panel/5"
              >
                {cols.map((f) => {
                  const value = row[f.name];

                  // Khoá chính: dẫn sang trang chi tiết của chính bản ghi này
                  if (f.isId) {
                    return (
                      <td key={f.name} className="px-2.5 py-2">
                        <Link
                          href={`/admin/${modelName}/${id}`}
                          className="num font-bold text-sign underline underline-offset-2"
                        >
                          {id}
                        </Link>
                      </td>
                    );
                  }

                  // Khoá ngoại: hiện nhãn, bấm sang bản ghi được trỏ tới
                  if (f.relatedModel && value !== null && value !== undefined) {
                    const label = refLabel(refLabels, f.name, value);
                    return (
                      <td
                        key={f.name}
                        className="max-w-[18rem] truncate px-2.5 py-2"
                        title={`${label} (id ${String(value)})`}
                      >
                        <Link
                          href={`/admin/${f.relatedModel}/${String(value)}`}
                          className="text-mint underline underline-offset-2 hover:text-sign"
                        >
                          {label}
                        </Link>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={f.name}
                      className="max-w-[22rem] truncate px-2.5 py-2 text-panel/85"
                      title={displayValue(value)}
                    >
                      {displayValue(value)}
                    </td>
                  );
                })}
                {actions && (
                  <td className="sticky right-0 border-l-2 border-panel/20 bg-enamel px-2.5 py-1.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
