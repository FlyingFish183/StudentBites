"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import { formatDateVi, formatVnd, toDateStr } from "@/lib/format";
import {
  MEAL_LABELS,
  MEAL_ORDER,
  type IDayPlan,
} from "@/lib/types";

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
  const days = nextDays(7);
  const today = toDateStr();

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
      onApiError(err, "Không thể tạo thực đơn. Hãy cập nhật hồ sơ trước."),
  });

  const swapMutation = useMutation({
    mutationFn: (itemId: number) =>
      api.post<{ plan: IDayPlan }>("/planner/swap", { itemId }),
    onSuccess: (data) => {
      setError("");
      queryClient.setQueryData(["plan", selectedDate], { plan: data.plan });
    },
    onError: (err) => onApiError(err, "Không còn món thay thế phù hợp"),
  });

  const plan = planQuery.data?.plan ?? null;

  return (
    <main className="px-4 pt-6">
      <h1 className="mb-4 text-xl font-bold">Thực đơn 🍱</h1>

      {/* Chọn ngày */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              selectedDate === d
                ? "bg-green-600 text-white shadow-md shadow-green-600/30"
                : "bg-white text-gray-600 shadow-sm"
            }`}
          >
            {d === today ? "Hôm nay" : formatDateVi(d)}
          </button>
        ))}
      </div>

      {/* Nút tạo thực đơn */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          disabled={generateMutation.isPending}
          onClick={() => generateMutation.mutate("day")}
          className="rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {generateMutation.isPending ? "Đang tạo..." : "🎲 Tạo cho ngày này"}
        </button>
        <button
          disabled={generateMutation.isPending}
          onClick={() => generateMutation.mutate("week")}
          className="rounded-xl border border-green-600 bg-white py-3 text-sm font-semibold text-green-700 transition active:scale-[0.98] disabled:opacity-50"
        >
          📅 Tạo cả tuần
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Cảnh báo ngân sách */}
      {plan && plan.budgetStatus.overBudget && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          🚨 Thực đơn vượt ngân sách ngày{" "}
          <b>{formatVnd(-plan.budgetStatus.diff)}</b>. Hãy đổi bớt món đắt.
        </div>
      )}

      {/* Tổng quan ngày */}
      {plan && plan.items.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-[11px] text-gray-400">Chi phí</p>
            <p
              className={`text-sm font-bold ${
                plan.budgetStatus.overBudget
                  ? "text-red-500"
                  : "text-green-600"
              }`}
            >
              {formatVnd(plan.totals.cost)}
            </p>
            <p className="text-[10px] text-gray-400">
              /{formatVnd(plan.budgetStatus.dailyBudget)}
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-[11px] text-gray-400">Protein</p>
            <p className="text-sm font-bold">{plan.totals.protein}g</p>
            <p className="text-[10px] text-gray-400">4 bữa</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-[11px] text-gray-400">Calories</p>
            <p className="text-sm font-bold">{plan.totals.kcal}</p>
            <p className="text-[10px] text-gray-400">kcal</p>
          </div>
        </div>
      )}

      {/* Danh sách bữa */}
      {planQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">Đang tải...</p>
      ) : plan && plan.items.length > 0 ? (
        <div className="space-y-3">
          {MEAL_ORDER.map((meal) => {
            const item = plan.items.find((i) => i.mealType === meal);
            if (!item) return null;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                    {MEAL_LABELS[meal]}
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {formatVnd(item.estimatedCost)}
                  </span>
                </div>
                <p className="text-base font-semibold">{item.dish.name}</p>
                {item.dish.description && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {item.dish.description}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    P {item.dish.protein}g · C {item.dish.carb}g · F{" "}
                    {item.dish.fat}g · {item.dish.kcal} kcal
                  </p>
                  <button
                    disabled={swapMutation.isPending}
                    onClick={() => swapMutation.mutate(item.id)}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition active:scale-95 disabled:opacity-50"
                  >
                    🔄 Đổi món
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white py-10 text-center shadow-sm">
          <p className="text-4xl">🍳</p>
          <p className="mt-2 text-sm text-gray-500">
            Chưa có thực đơn cho ngày này.
            <br />
            Bấm &quot;Tạo cho ngày này&quot; để bắt đầu!
          </p>
        </div>
      )}
    </main>
  );
}
