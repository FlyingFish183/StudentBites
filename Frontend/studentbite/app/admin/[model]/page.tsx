"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import DataTable from "@/components/admin/DataTable";
import RecordForm from "@/components/admin/RecordForm";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api";
import type { IAdminList, IAdminRow } from "@/lib/admin";

const PAGE_SIZE = 20;

export default function AdminModelPage() {
  const { model } = useParams<{ model: string }>();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Lọc theo khoá ngoại, đến từ link "Xem tất cả" ở trang chi tiết.
  const filterField = searchParams.get("filterField");
  const filterValue = searchParams.get("filterValue");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<IAdminRow | null | undefined>(
    undefined,
  );
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const listQuery = useQuery({
    queryKey: ["admin-list", model, page, q, filterField, filterValue],
    retry: false,
    queryFn: () =>
      api.get<IAdminList>(
        `/admin/${model}?page=${page}&pageSize=${PAGE_SIZE}` +
          (q ? `&q=${encodeURIComponent(q)}` : "") +
          (filterField && filterValue
            ? `&filterField=${encodeURIComponent(filterField)}` +
              `&filterValue=${encodeURIComponent(filterValue)}`
            : ""),
      ),
  });

  function afterWrite() {
    setEditing(undefined);
    setFormError("");
    void queryClient.invalidateQueries({ queryKey: ["admin-list", model] });
    void queryClient.invalidateQueries({ queryKey: ["admin-models"] });
  }

  function onWriteError(err: unknown) {
    setFormError(
      err instanceof ApiError ? err.message : "Không lưu được. Thử lại.",
    );
  }

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      api.post(`/admin/${model}`, data),
    onSuccess: afterWrite,
    onError: onWriteError,
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; data: Record<string, string> }) =>
      api.put(`/admin/${model}/${input.id}`, input.data),
    onSuccess: afterWrite,
    onError: onWriteError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/admin/${model}/${id}`),
    onSuccess: () => {
      setDeleteError("");
      void queryClient.invalidateQueries({ queryKey: ["admin-list", model] });
      void queryClient.invalidateQueries({ queryKey: ["admin-models"] });
    },
    onError: (err) =>
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "Không xoá được. Có thể còn bản ghi khác đang tham chiếu tới.",
      ),
  });

  const data = listQuery.data;
  const meta = data?.model;
  const saving = createMutation.isPending || updateMutation.isPending;

  function onDelete(row: IAdminRow) {
    if (!meta) return;
    const id = String(row[meta.idField]);
    if (
      !window.confirm(
        `Xoá ${meta.label} #${id}? Thao tác này không hoàn tác được.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(id);
  }

  if (listQuery.isError) {
    return (
      <Banner tone="critical">
        {listQuery.error instanceof ApiError
          ? listQuery.error.message
          : "Không tải được dữ liệu bảng này."}
      </Banner>
    );
  }

  return (
    <>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="label text-panel/50">{model}</p>
          <h1 className="disp mt-1 text-[1.6rem] leading-none text-sign">
            {meta?.label ?? model}
          </h1>
          {data && (
            <p className="num mt-1.5 text-[0.75rem] text-panel/55">
              {data.total.toLocaleString("vi-VN")} bản ghi
              {q && ` khớp “${q}”`}
            </p>
          )}
        </div>
        {meta?.readOnlyModel ? (
          <span className="label border-2 border-panel/25 px-3 py-2 text-panel/50">
            Bảng chỉ đọc
          </span>
        ) : (
          <Button icon="plus" onClick={() => setEditing(null)} disabled={!meta}>
            Thêm mới
          </Button>
        )}
      </header>

      {/* Tìm kiếm */}
      {meta && meta.searchable.length > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQ(search.trim());
          }}
          className="mb-4 flex gap-2"
        >
          <div className="relative max-w-md flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Tìm trong: ${meta.searchable.join(", ")}`}
              aria-label="Từ khoá tìm kiếm"
              className="w-full border-2 border-ink bg-panel py-2 pr-3 pl-9 text-[0.8rem] font-semibold text-ink placeholder:font-normal placeholder:text-ink/35 focus:outline-none"
            />
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink/40"
            />
          </div>
          <Button type="submit" size="sm">
            Tìm
          </Button>
          {q && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearch("");
                setQ("");
                setPage(1);
              }}
            >
              Xoá lọc
            </Button>
          )}
        </form>
      )}

      {filterField && filterValue && (
        <div className="mb-4 flex flex-wrap items-center gap-2 border-2 border-sign/40 bg-enamel-deep px-3 py-2">
          <Icon name="search" className="size-3.5 shrink-0 text-sign" />
          <p className="text-[0.75rem] text-panel/70">
            Đang lọc{" "}
            <span className="num font-bold text-sign">
              {filterField} = {filterValue}
            </span>
          </p>
          <Link
            href={`/admin/${model}`}
            className="disp ml-auto border-2 border-panel/35 px-2 py-1 text-[0.55rem] tracking-[0.12em] text-panel/75 hover:border-sign hover:text-sign"
          >
            Bỏ lọc
          </Link>
        </div>
      )}

      {deleteError && (
        <Banner tone="critical" className="mb-4">
          {deleteError}
        </Banner>
      )}

      {/* Bảng */}
      {listQuery.isPending || !meta || !data ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : data.rows.length === 0 ? (
        <EmptyState
          icon="chart"
          title={q ? "Không có bản ghi nào khớp" : "Bảng này đang trống"}
          hint={
            q ? "Thử từ khoá khác." : "Bấm “Thêm mới” để tạo bản ghi đầu tiên."
          }
        />
      ) : (
        <DataTable
          modelName={model}
          idField={meta.idField}
          fields={meta.fields}
          rows={data.rows}
          refLabels={data.refLabels}
          actions={
            meta.readOnlyModel
              ? undefined
              : (row) => (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setFormError("");
                        setEditing(row);
                      }}
                      className="disp press border-2 border-panel/35 px-2 py-1 text-[0.55rem] tracking-[0.12em] text-panel/75 hover:border-sign hover:text-sign"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      disabled={deleteMutation.isPending}
                      className="disp press border-2 border-panel/35 px-2 py-1 text-[0.55rem] tracking-[0.12em] text-panel/75 hover:border-chili hover:text-chili disabled:opacity-40"
                    >
                      Xoá
                    </button>
                  </>
                )
          }
        />
      )}

      {/* Phân trang */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            icon="chevronLeft"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Trước
          </Button>
          <span className="num text-[0.75rem] text-panel/60">
            Trang {data.page} / {data.totalPages}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Form thêm / sửa */}
      {editing !== undefined && meta && (
        <RecordForm
          model={meta}
          row={editing}
          saving={saving}
          error={formError}
          onCancel={() => {
            setEditing(undefined);
            setFormError("");
          }}
          onSubmit={(values) => {
            setFormError("");
            if (editing) {
              updateMutation.mutate({
                id: String(editing[meta.idField]),
                data: values,
              });
            } else {
              createMutation.mutate(values);
            }
          }}
        />
      )}
    </>
  );
}
