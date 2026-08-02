"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Banner from "@/components/ui/Banner";
import Board from "@/components/ui/Board";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api";
import { formatDateVi, formatVnd, toDateStr } from "@/lib/format";
import { MEAL_LABELS, MEAL_ORDER, type IDayPlan } from "@/lib/types";

/** Dải 7 ngày kể từ hôm nay để chọn nhanh. */
function nextDays(n: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(toDateStr(d));
  }
  return days;
}

export default function PlannerPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(toDateStr());
  const [error, setError] = useState("");
  const [days] = useState(() => nextDays(7));
  const today = days[0];

  const planQuery = useQuery({
    queryKey: ["plan", selectedDate],
    queryFn: () =>
      api.get<{ plan: IDayPlan | null }>(`/planner?date=${selectedDate}`),
  });

  function onApiError(err: unknown, fallback: string) {
    setError(err instanceof ApiError ? err.message : fallback);
  }

  const generateMutation = useMutation({
    mutationFn: (range: "day" | "week") =>
      api.post<{ plans: IDayPlan[] }>("/planner/generate", {
        date: selectedDate,
        range,
      }),
    onSuccess: () => {
      setError("");
      void queryClient.invalidateQueries({ queryKey: ["plan"] });
    },
    onError: (err) =>
      onApiError(err, "Chưa tạo được thực đơn. Hãy cập nhật hồ sơ trước."),
  });

  const swapMutation = useMutation({
    mutationFn: (itemId: number) =>
      api.post<{ plan: IDayPlan }>("/planner/swap", { itemId }),
    onSuccess: (data) => {
      setError("");
      queryClient.setQueryData(["plan", selectedDate], { plan: data.plan });
    },
    onError: (err) =>
      onApiError(err, "Không còn món thay thế nào vừa ngân sách bữa này."),
  });

  const plan = planQuery.data?.plan ?? null;
  const hasPlan = !!plan && plan.items.length > 0;
  const overBy = plan ? -plan.budgetStatus.diff : 0;

  return (
    <main>
      <PageHeader title="Thực đơn" aside={formatDateVi(selectedDate)} />

      <div className="px-4 pt-3 lg:px-6 lg:pt-5">
        {/* Chọn ngày — cuộn ngang trên mobile, xuống dòng trên desktop */}
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          {days.map((d) => (
            <Chip
              key={d}
              active={selectedDate === d}
              onClick={() => setSelectedDate(d)}
            >
              {d === today ? "Hôm nay" : formatDateVi(d)}
            </Chip>
          ))}
        </div>

        {/* Tạo thực đơn */}
        <div className="mb-4 grid grid-cols-2 gap-3 lg:w-fit lg:grid-cols-none lg:grid-flow-col">
          <Button
            icon="dice"
            loading={generateMutation.isPending}
            onClick={() => generateMutation.mutate("day")}
          >
            {hasPlan ? "Tạo lại ngày" : "Tạo ngày này"}
          </Button>
          <Button
            variant="ghost"
            icon="calendar"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate("week")}
          >
            Tạo cả tuần
          </Button>
        </div>

        {error && <Banner tone="critical" className="mb-3">{error}</Banner>}

        {plan?.budgetStatus.overBudget && (
          <Banner tone="critical" className="mb-3">
            Vượt <span className="num">{formatVnd(overBy)}</span> so với hạn mức
            ngày. Đổi bớt một món đắt để cân lại.
          </Banner>
        )}

        {/* Tổng quan ngày */}
        {hasPlan && (
          <div className="mb-5 grid grid-cols-3 gap-2 lg:max-w-md lg:gap-3">
            {[
              {
                k: "Chi phí",
                v: formatVnd(plan.totals.cost),
                sub: `/${formatVnd(plan.budgetStatus.dailyBudget)}`,
                danger: plan.budgetStatus.overBudget,
              },
              {
                k: "Protein",
                v: `${plan.totals.protein}g`,
                sub: `${plan.items.length} bữa`,
                danger: false,
              },
              {
                k: "Calories",
                v: plan.totals.kcal.toLocaleString("vi-VN"),
                sub: "kcal",
                danger: false,
              },
            ].map((s) => (
              <div
                key={s.k}
                className="border-2 border-panel/25 bg-enamel-deep px-2 py-2.5 text-center"
              >
                <p className="label text-panel/50">{s.k}</p>
                <p
                  className={`disp-num mt-1 text-[1.05rem] ${
                    s.danger ? "text-chili" : "text-panel"
                  }`}
                >
                  {s.v}
                </p>
                <p className="num text-[0.6rem] text-panel/40">{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Danh sách bữa */}
        <Board title="Các bữa" icon="bowl">
          {planQuery.isPending ? (
            <div className="grid gap-3 md:grid-cols-2 lg:gap-5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : hasPlan ? (
            <div className="grid gap-3.5 md:grid-cols-2 lg:gap-5">
              {MEAL_ORDER.map((meal) => {
                const item = plan.items.find((i) => i.mealType === meal);
                if (!item) return null;
                const swapping =
                  swapMutation.isPending && swapMutation.variables === item.id;
                return (
                  <article
                    key={item.id}
                    className="card-sign flex flex-col px-3.5 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="disp bg-ink px-1.5 py-0.5 text-[0.56rem] tracking-[0.14em] text-sign">
                        {MEAL_LABELS[meal]}
                      </span>
                      <span className="disp-num text-[1.15rem]">
                        {formatVnd(item.estimatedCost)}
                      </span>
                    </div>

                    <h3 className="mt-2 text-[1rem] leading-tight font-bold">
                      {item.dish.name}
                    </h3>
                    {item.dish.description && (
                      <p className="mt-1 text-[0.72rem] leading-snug text-ink/60">
                        {item.dish.description}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2 border-t-2 border-ink/15 pt-2.5">
                      <p className="num text-[0.68rem] font-semibold text-ink/65">
                        P {item.dish.protein}g · C {item.dish.carb}g · F{" "}
                        {item.dish.fat}g · {item.dish.kcal} kcal
                      </p>
                      <button
                        type="button"
                        disabled={swapMutation.isPending}
                        onClick={() => swapMutation.mutate(item.id)}
                        className="disp press inline-flex shrink-0 items-center gap-1 border-2 border-ink px-2 py-1 text-[0.56rem] tracking-[0.12em] disabled:opacity-40"
                      >
                        <Icon
                          name={swapping ? "spinner" : "swap"}
                          className="size-3"
                          strokeWidth={2.4}
                        />
                        Đổi món
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="dice"
              title="Ngày này chưa có thực đơn"
              hint="Bấm “Tạo ngày này” — app sẽ chọn món đủ đạm mà vẫn nằm trong hạn mức."
            />
          )}
        </Board>
      </div>
    </main>
  );
}
