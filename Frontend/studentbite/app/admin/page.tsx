"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import Skeleton from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import type { IAdminModelWithCount } from "@/lib/admin";

/** Tổng quan: mỗi bảng một ô, kèm số bản ghi. */
export default function AdminHomePage() {
  const modelsQuery = useQuery({
    queryKey: ["admin-models"],
    retry: false,
    queryFn: () =>
      api.get<{ models: IAdminModelWithCount[] }>("/admin/models"),
  });

  const models = modelsQuery.data?.models ?? [];

  return (
    <>
      <header className="mb-6">
        <p className="label text-panel/50">Tổng quan</p>
        <h1 className="disp mt-1.5 text-[1.7rem] leading-none text-sign">
          Dữ liệu hệ thống
        </h1>
        <p className="mt-2 text-[0.8rem] text-panel/60">
          Chọn một bảng để xem, thêm, sửa hoặc xoá bản ghi.
        </p>
      </header>

      {modelsQuery.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {models.map((m) => (
            <Link
              key={m.name}
              href={`/admin/${m.name}`}
              className="press border-2 border-panel/25 bg-enamel-deep px-4 py-3.5 transition-colors hover:border-sign"
            >
              <p className="label text-panel/45">{m.name}</p>
              <p className="disp mt-1 text-[1.05rem] text-panel">{m.label}</p>
              <p className="disp-num mt-2 text-[1.6rem] text-sign">
                {m.count.toLocaleString("vi-VN")}
              </p>
              <p className="text-[0.65rem] text-panel/40">
                {m.fields.length} cột
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
