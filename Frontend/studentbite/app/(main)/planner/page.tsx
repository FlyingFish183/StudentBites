"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import { formatDateVi, formatVnd, toDateStr } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import CountUp from "@/components/CountUp";
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
  const [swappingId, setSwappingId] = useState<number | null>(null);
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
    onSettled: () => setSwappingId(null),
  });

  const plan = planQuery.data?.plan ?? null;
  const overBudget = !!plan && plan.budgetStatus.overBudget;

  return (
    <main className="px-4 pt-6 lg:px-8">
      <motion.h1
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-4 text-xl font-bold lg:text-2xl"
      >
        Thực đơn 🍱
      </motion.h1>

      {/* Chọn ngày */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {days.map((d) => {
          const active = selectedDate === d;
          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`relative shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                active ? "text-white" : "card text-muted"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="planner-day-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-primary shadow-md shadow-primary/30"
                />
              )}
              <span className="relative">
                {d === today ? "Hôm nay" : formatDateVi(d)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Nút tạo thực đơn */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <button
          disabled={generateMutation.isPending}
          onClick={() => generateMutation.mutate("day")}
          className="rounded-xl bg-primary py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {generateMutation.isPending ? "Đang tạo..." : "🎲 Tạo cho ngày này"}
        </button>
        <button
          disabled={generateMutation.isPending}
          onClick={() => generateMutation.mutate("week")}
          className="rounded-xl border border-primary bg-surface py-3 text-sm font-semibold text-primary-dark transition active:scale-[0.98] disabled:opacity-50"
        >
          📅 Tạo cả tuần
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
          {error}
        </p>
      )}

      {/* Cảnh báo ngân sách + tổng quan (shake khi vượt) */}
      {plan && plan.items.length > 0 && (
        <motion.div
          animate={overBudget ? { x: [-5, 5, -5, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4"
        >
          {overBudget && (
            <div className="mb-3 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning">
              🚨 Thực đơn vượt ngân sách ngày{" "}
              <b>{formatVnd(-plan.budgetStatus.diff)}</b>. Hãy đổi bớt món đắt.
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 sm:max-w-lg">
            <div className="card rounded-xl p-3 text-center">
              <p className="text-[11px] text-muted">Chi phí</p>
              <p
                className={`text-sm font-bold transition-colors ${
                  overBudget ? "text-warning" : "text-primary-dark"
                }`}
              >
                <CountUp value={plan.totals.cost} format={formatVnd} />
              </p>
              <p className="text-[10px] text-muted">
                /{formatVnd(plan.budgetStatus.dailyBudget)}
              </p>
            </div>
            <div className="card rounded-xl p-3 text-center">
              <p className="text-[11px] text-muted">Protein</p>
              <p className="text-sm font-bold">
                <CountUp value={plan.totals.protein} format={(n) => `${Math.round(n)}g`} />
              </p>
              <p className="text-[10px] text-muted">4 bữa</p>
            </div>
            <div className="card rounded-xl p-3 text-center">
              <p className="text-[11px] text-muted">Calories</p>
              <p className="text-sm font-bold">
                <CountUp value={plan.totals.kcal} />
              </p>
              <p className="text-[10px] text-muted">kcal</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Danh sách bữa: cột đơn (mobile) / lưới (desktop) */}
      {planQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-muted">Đang tải...</p>
      ) : plan && plan.items.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {MEAL_ORDER.map((meal) => {
            const item = plan.items.find((i) => i.mealType === meal);
            if (!item) return null;
            const swapping = swappingId === item.id && swapMutation.isPending;
            return (
              <motion.div
                key={meal}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="card relative overflow-hidden rounded-2xl p-4"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-dark">
                    {MEAL_LABELS[meal]}
                  </span>
                  <span className="text-sm font-bold">
                    {formatVnd(item.estimatedCost)}
                  </span>
                </div>

                {/* Card swap morph: đổi dish.id -> fade + trượt ngang */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={item.dish.id}
                    initial={{ opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -32 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  >
                    <p className="text-base font-semibold">{item.dish.name}</p>
                    {item.dish.description && (
                      <p className="mt-0.5 text-xs text-muted">
                        {item.dish.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted">
                      P {item.dish.protein}g · C {item.dish.carb}g · F{" "}
                      {item.dish.fat}g · {item.dish.kcal} kcal
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-3 flex justify-end">
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    disabled={swapMutation.isPending}
                    onClick={() => {
                      setSwappingId(item.id);
                      swapMutation.mutate(item.id);
                    }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition disabled:opacity-50"
                  >
                    <span className={swapping ? "inline-block animate-spin" : ""}>
                      🔄
                    </span>{" "}
                    Đổi món
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="card rounded-2xl py-10 text-center">
          <p className="text-4xl">🍳</p>
          <p className="mt-2 text-sm text-muted">
            Chưa có thực đơn cho ngày này.
            <br />
            Bấm &quot;Tạo cho ngày này&quot; để bắt đầu!
          </p>
        </div>
      )}
    </main>
  );
}
