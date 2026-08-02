"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { IAdminOptions } from "@/lib/admin";

interface IProps {
  id: string;
  /** Bảng mà khoá ngoại này trỏ tới. */
  modelName: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
}

/**
 * Ô chọn khoá ngoại: lấy danh sách từ bảng liên quan thay vì bắt người dùng
 * nhớ id. Bảng quá lớn thì backend cắt bớt và báo lại, khi đó vẫn nhập tay
 * được id.
 */
export default function RelationSelect({
  id,
  modelName,
  value,
  onChange,
  className,
}: IProps) {
  const optionsQuery = useQuery({
    queryKey: ["admin-options", modelName],
    staleTime: 60_000,
    queryFn: () => api.get<IAdminOptions>(`/admin/${modelName}/options`),
  });

  if (optionsQuery.isPending) {
    return (
      <select id={id} className={className} disabled>
        <option>Đang tải {modelName}…</option>
      </select>
    );
  }

  const data = optionsQuery.data;
  const options = data?.options ?? [];
  // Bảng bị cắt bớt nên giá trị hiện tại có thể không nằm trong danh sách —
  // vẫn phải hiện ra, nếu không mở form sửa là mất luôn khoá ngoại cũ.
  const missing =
    value !== "" && !options.some((o) => String(o.value) === value);

  if (optionsQuery.isError) {
    return (
      <input
        id={id}
        type="number"
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`id của ${modelName}`}
      />
    );
  }

  return (
    <>
      <select
        id={id}
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— trống —</option>
        {missing && <option value={value}>#{value} (ngoài danh sách)</option>}
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      {data?.truncated && (
        <p className="mt-0.5 text-[0.6rem] text-mango">
          Bảng có {data.total} bản ghi, chỉ liệt kê {options.length} đầu tiên.
        </p>
      )}
    </>
  );
}
