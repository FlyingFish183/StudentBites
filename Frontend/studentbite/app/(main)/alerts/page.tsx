"use client";

import { useState, useMemo } from "react";

import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import PageHeader from "@/components/ui/PageHeader";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import {
  useIngredients,
  usePriceAlerts,
  useCreatePriceAlert,
  useDeletePriceAlert,
} from "@/lib/hooks";
import type { IIngredient } from "@/lib/types";

export default function AlertsPage() {
  const { data: ingredientsData, isLoading: ingredientsLoading } = useIngredients();
  const { data: alertsData, isLoading: alertsLoading } = usePriceAlerts();
  const createAlert = useCreatePriceAlert();
  const deleteAlert = useDeletePriceAlert();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [thresholdPct, setThresholdPct] = useState(10);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const ingredients = ingredientsData?.ingredients ?? [];
  const alerts = alertsData?.alerts ?? [];

  // Build a set of ingredientIds that already have alerts
  const alertedIds = useMemo(
    () => new Set(alerts.map((a) => a.ingredientId)),
    [alerts],
  );

  // Group ingredients by category (only those without alerts)
  const availableByCategory = useMemo(() => {
    const grouped: Record<string, IIngredient[]> = {};
    for (const ing of ingredients) {
      if (alertedIds.has(ing.id)) continue;
      if (!grouped[ing.category]) grouped[ing.category] = [];
      grouped[ing.category].push(ing);
    }
    return grouped;
  }, [ingredients, alertedIds]);

  const categoryKeys = Object.keys(availableByCategory);

  const handleSelect = (id: number) => {
    setSelectedId(selectedId === id ? null : id);
    setThresholdPct(10);
  };

  const handleCreate = (ingredientId: number) => {
    createAlert.mutate(
      { ingredientId, thresholdPct },
      {
        onSuccess: () => {
          setSelectedId(null);
          setThresholdPct(10);
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    if (confirmId === id) {
      deleteAlert.mutate(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
    }
  };

  const isLoading = ingredientsLoading || alertsLoading;

  return (
    <main>
      <PageHeader eyebrow="Cài đặt" title="Cảnh báo giá" />

      <div className="px-4 pt-4 lg:px-6 lg:pt-6">
        {/* Ingredient picker section */}
        <section className="mb-6">
          <p className="label mb-3 text-panel/60">Chọn nguyên liệu để theo dõi</p>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 animate-pulse bg-panel/10" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 4 }, (_, j) => (
                      <div
                        key={j}
                        className="h-9 w-20 animate-pulse border-2 border-panel/10 bg-panel/5"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : categoryKeys.length === 0 && alerts.length > 0 ? (
            <EmptyState
              icon="check"
              title="Bạn đã theo dõi tất cả nguyên liệu"
              hint="Tất cả nguyên liệu đã được đặt cảnh báo giá."
            />
          ) : categoryKeys.length === 0 ? (
            <EmptyState
              icon="bowl"
              title="Chưa có nguyên liệu nào"
              hint="Hệ thống chưa có dữ liệu nguyên liệu. Vui lòng quay lại sau."
            />
          ) : (
            <div className="space-y-4">
              {categoryKeys.map((category) => (
                <div key={category}>
                  <p className="label mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-panel/50">
                    {category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableByCategory[category].map((ing) => (
                      <div key={ing.id} className="relative">
                        <Chip
                          active={selectedId === ing.id}
                          onClick={() => handleSelect(ing.id)}
                          disabled={createAlert.isPending && selectedId === ing.id}
                        >
                          {ing.name}
                        </Chip>

                        {/* Inline threshold form */}
                        {selectedId === ing.id && (
                          <div className="anim-rise-sm absolute left-0 top-full z-10 mt-2 flex items-center gap-2 border-2 border-sign bg-enamel-deep px-3 py-2 shadow-hard-sm">
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={thresholdPct}
                              onChange={(e) => setThresholdPct(Number(e.target.value))}
                              className="w-14 border-2 border-panel/20 bg-enamel px-2 py-1 text-[0.75rem] text-panel focus:border-sign focus:outline-none"
                            />
                            <span className="text-[0.7rem] text-panel/60">%</span>
                            <Button
                              size="sm"
                              icon="plus"
                              onClick={() => handleCreate(ing.id)}
                              loading={createAlert.isPending}
                              disabled={!thresholdPct || thresholdPct < 1}
                            >
                              Đặt
                            </Button>
                            <button
                              type="button"
                              onClick={() => setSelectedId(null)}
                              className="press text-panel/50 hover:text-chili"
                            >
                              <Icon name="close" className="size-4" strokeWidth={2.2} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {createAlert.isError && (
            <p className="mt-3 text-[0.7rem] text-chili">
              Không tạo được cảnh báo. Vui lòng thử lại.
            </p>
          )}
        </section>

        {/* Active alerts list */}
        <section>
          <p className="label mb-3 text-panel/60">Cảnh báo đang hoạt động</p>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="h-14 w-full animate-pulse rounded border-2 border-panel/10 bg-panel/5"
                />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <EmptyState
              icon="alert"
              title="Bạn chưa đặt cảnh báo giá nào"
              hint="Chọn nguyên liệu ở trên để thêm cảnh báo khi giảm giá."
            />
          ) : (
            <div className="stagger-in grid gap-2">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="row-hover flex items-center gap-3 border-2 border-panel/12 px-4 py-3"
                >
                  <Icon
                    name="bell"
                    className="size-4 shrink-0 text-mango"
                    strokeWidth={2}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.82rem] font-semibold text-panel">
                      {a.ingredientName}
                    </p>
                    <p className="text-[0.68rem] text-panel/50">
                      Báo khi giảm từ {a.thresholdPct}% trở lên
                    </p>
                  </div>
                  <span className="disp shrink-0 border-2 border-mango/40 bg-mango/10 px-2 py-0.5 text-[0.58rem] tracking-wider text-mango">
                    {a.thresholdPct}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    disabled={deleteAlert.isPending}
                    className={`disp press ml-2 flex items-center gap-1 border-2 px-2.5 py-1 text-[0.55rem] tracking-wider transition-colors ${
                      confirmId === a.id
                        ? "border-chili bg-chili text-enamel-deep"
                        : "border-panel/25 text-panel/50 hover:border-chili hover:text-chili"
                    }`}
                  >
                    <Icon name="trash" className="size-3" strokeWidth={2} />
                    {confirmId === a.id ? "Xác nhận" : "Xoá"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
