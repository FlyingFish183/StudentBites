"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import DataTable from "@/components/admin/DataTable";
import RecordForm from "@/components/admin/RecordForm";
import Banner from "@/components/ui/Banner";
import Board from "@/components/ui/Board";
import Button, { buttonClass } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api";
import { displayValue, refLabel, type IAdminDetail } from "@/lib/admin";

export default function AdminDetailPage() {
  const { model, id } = useParams<{ model: string; id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");

  const detailQuery = useQuery({
    queryKey: ["admin-detail", model, id],
    retry: false,
    queryFn: () => api.get<IAdminDetail>(`/admin/${model}/${id}`),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      api.put(`/admin/${model}/${id}`, data),
    onSuccess: () => {
      setEditing(false);
      setFormError("");
      void queryClient.invalidateQueries({ queryKey: ["admin-detail", model] });
      void queryClient.invalidateQueries({ queryKey: ["admin-list", model] });
    },
    onError: (err) =>
      setFormError(
        err instanceof ApiError ? err.message : "Không lưu được. Thử lại.",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/admin/${model}/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-list", model] });
      void queryClient.invalidateQueries({ queryKey: ["admin-models"] });
      router.replace(`/admin/${model}`);
    },
    onError: (err) =>
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Không xoá được. Có thể còn bản ghi khác đang tham chiếu tới.",
      ),
  });

  if (detailQuery.isError) {
    return (
      <>
        <Banner tone="critical" className="mb-4">
          {detailQuery.error instanceof ApiError
            ? detailQuery.error.message
            : "Không tải được bản ghi này."}
        </Banner>
        <Link href={`/admin/${model}`} className={buttonClass("ghost", "sm")}>
          <Icon name="chevronLeft" className="size-3.5" />
          Về danh sách
        </Link>
      </>
    );
  }

  const data = detailQuery.data;
  const meta = data?.model;

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/admin/${model}`}
            className="label inline-flex items-center gap-1 text-panel/50 hover:text-sign"
          >
            <Icon name="chevronLeft" className="size-3" />
            {meta?.label ?? model}
          </Link>
          <h1 className="disp mt-1 text-[1.6rem] leading-none text-sign">
            {meta?.label ?? model} <span className="num">#{id}</span>
          </h1>
        </div>
        {meta && !meta.readOnlyModel && (
          <div className="flex gap-2">
            <Button
              size="sm"
              icon="swap"
              onClick={() => {
                setFormError("");
                setEditing(true);
              }}
            >
              Sửa
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon="trash"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `Xoá ${meta.label} #${id}? Thao tác này không hoàn tác được.`,
                  )
                ) {
                  deleteMutation.mutate();
                }
              }}
            >
              Xoá
            </Button>
          </div>
        )}
      </header>

      {actionError && (
        <Banner tone="critical" className="mb-4">
          {actionError}
        </Banner>
      )}

      {/* Các cột của chính bản ghi */}
      <Board title="Thông tin" icon="chart" className="mb-7">
        {!data || !meta ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        ) : (
          <dl className="grid gap-x-8 gap-y-0 border-2 border-panel/20 px-4 py-2 sm:grid-cols-2">
            {meta.fields.map((f) => {
              const value = data.row[f.name];
              return (
                <div
                  key={f.name}
                  className="rule-soft flex items-baseline justify-between gap-4 py-2 first:border-t-0 sm:even:border-t sm:[&:nth-child(2)]:border-t-0"
                >
                  <dt className="label shrink-0 text-panel/50">{f.name}</dt>
                  <dd className="min-w-0 truncate text-right text-[0.8rem] font-semibold">
                    {f.relatedModel && value !== null && value !== undefined ? (
                      <Link
                        href={`/admin/${f.relatedModel}/${String(value)}`}
                        className="text-mint underline underline-offset-2 hover:text-sign"
                      >
                        {refLabel(data.refLabels, f.name, value)}
                      </Link>
                    ) : (
                      <span
                        className="text-panel/85"
                        title={displayValue(value)}
                      >
                        {displayValue(value)}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </Board>

      {/* Bản ghi ở bảng khác trỏ về bản ghi này */}
      {data?.related.map((rel) => (
        <Board
          key={`${rel.model}-${rel.foreignKey}`}
          title={rel.label}
          icon="arrowRight"
          className="mb-7"
          aside={
            rel.total > rel.rows.length ? (
              <Link
                href={`/admin/${rel.model}?filterField=${rel.foreignKey}&filterValue=${id}`}
                className="hover:text-sign"
              >
                Xem tất cả {rel.total} →
              </Link>
            ) : (
              `${rel.total}`
            )
          }
        >
          <DataTable
            modelName={rel.model}
            idField={rel.idField}
            fields={rel.fields}
            rows={rel.rows}
            refLabels={rel.refLabels}
            // Cột trỏ ngược về chính bản ghi đang xem thì lặp lại vô nghĩa
            hideFields={[rel.foreignKey]}
          />
        </Board>
      ))}

      {data && data.related.length === 0 && (
        <p className="text-[0.75rem] text-panel/45">
          Không có bản ghi nào ở bảng khác trỏ tới bản ghi này.
        </p>
      )}

      {editing && meta && data && (
        <RecordForm
          model={meta}
          row={data.row}
          saving={updateMutation.isPending}
          error={formError}
          onCancel={() => {
            setEditing(false);
            setFormError("");
          }}
          onSubmit={(values) => {
            setFormError("");
            updateMutation.mutate(values);
          }}
        />
      )}
    </>
  );
}
