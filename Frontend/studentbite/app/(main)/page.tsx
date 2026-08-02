"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AnimatedBar from "@/components/AnimatedBar";
import Confetti from "@/components/Confetti";
import CountUp from "@/components/CountUp";
import GlowAlert from "@/components/GlowAlert";
import RingGauge from "@/components/RingGauge";
import { api, ApiError } from "@/lib/api";
import { formatVnd, toDateStr } from "@/lib/format";
import { fadeInUp, popIn, staggerContainer } from "@/lib/motion";
import { useMe } from "@/lib/hooks";
import {
  MEAL_LABELS,
  MEAL_ORDER,
  type IDailyStats,
  type IDayLog,
  type IDayPlan,
  type IProfile,
} from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useMe();
  const today = toDateStr();
  const [confetti, setConfetti] = useState(0);

  // hồ sơ: chưa có -> đưa sang onboarding
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<{ profile: IProfile | null }>("/profile"),
  });
  useEffect(() => {
    if (profileQuery.data && profileQuery.data.profile === null) {
      router.replace("/onboarding");
    }
  }, [profileQuery.data, router]);

  const statsQuery = useQuery({
    queryKey: ["stats-daily", today],
    queryFn: () => api.get<IDailyStats>(`/stats/daily?date=${today}`),
    enabled: !!profileQuery.data?.profile,
  });

  const planQuery = useQuery({
    queryKey: ["plan", today],
    queryFn: () => api.get<{ plan: IDayPlan | null }>(`/planner?date=${today}`),
    enabled: !!profileQuery.data?.profile,
  });

  const logsQuery = useQuery({
    queryKey: ["logs-day", today],
    queryFn: () => api.get<{ logs: IDayLog[] }>(`/logs/day/${today}`),
    enabled: !!profileQuery.data?.profile,
  });

  const eatMutation = useMutation({
    mutationFn: (input: { mealType: string; dishId: number }) =>
      api.post("/logs", { date: today, ...input }),
    onSuccess: () => {
      setConfetti((n) => n + 1);
      void queryClient.invalidateQueries({ queryKey: ["stats-daily"] });
      void queryClient.invalidateQueries({ queryKey: ["logs-day"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.replace("/login");
    },
  });

  const stats = statsQuery.data;
  const plan = planQuery.data?.plan ?? null;
  const logs = logsQuery.data?.logs ?? [];
  const loggedMeals = new Set(logs.map((l) => `${l.mealType}`));
  const budgetLeft = stats ? stats.targets.dailyBudget - stats.consumed.cost : 0;
  const overBudget = stats ? budgetLeft < 0 || stats.budgetWarning : false;
  const proteinLow = !!stats && stats.proteinWarning && stats.consumed.kcal > 0;

  return (
    <main className="px-4 pt-6 lg:px-8">
      <Confetti trigger={confetti} />

      {/* Header + budget status badge */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-5 flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <p className="text-sm text-muted">Chào bạn 👋</p>
          <h1 className="truncate text-xl font-bold lg:text-2xl">
            {user?.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 20 }}
              className={`hidden rounded-full px-3 py-1.5 text-xs font-semibold sm:inline-flex ${
                overBudget
                  ? "bg-warning-soft text-warning"
                  : "bg-primary-soft text-primary-dark"
              }`}
            >
              {overBudget
                ? "⚠️ Vượt ngân sách"
                : `Còn ${formatVnd(Math.max(budgetLeft, 0))}`}
            </motion.span>
          )}
          <Link
            href="/onboarding"
            className="card rounded-full p-2.5 text-lg"
            title="Cập nhật hồ sơ"
          >
            ⚙️
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            className="card rounded-full p-2.5 text-lg"
            title="Đăng xuất"
          >
            🚪
          </button>
        </div>
      </motion.header>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-4 lg:grid-cols-3"
      >
        {/* Ngân sách hôm nay */}
        {stats && (
          <motion.section
            variants={fadeInUp}
            whileHover={{ y: -4 }}
            className={`rounded-2xl p-5 text-white shadow-lg ${
              overBudget
                ? "bg-warning shadow-[var(--warning)]/20"
                : "bg-primary-dark shadow-primary/20"
            }`}
          >
            <p className="text-sm/none opacity-80">Ngân sách hôm nay còn</p>
            <p className="mt-2 text-3xl font-bold">
              <CountUp value={Math.max(budgetLeft, 0)} format={formatVnd} />
            </p>
            <div className="mt-3 flex items-center justify-between text-xs opacity-90">
              <span>Đã chi: {formatVnd(stats.consumed.cost)}</span>
              <span>Tổng: {formatVnd(stats.targets.dailyBudget)}/ngày</span>
            </div>
            {stats.budgetWarning && (
              <p className="mt-3 rounded-lg bg-black/15 px-3 py-2 text-xs font-medium">
                ⚠️ Hôm nay bạn đã chi vượt ngân sách ngày!
              </p>
            )}
          </motion.section>
        )}

        {/* Dinh dưỡng hôm nay */}
        <motion.section
          variants={fadeInUp}
          className="card rounded-2xl p-5 lg:col-span-2"
        >
          <h2 className="mb-4 font-semibold">Dinh dưỡng hôm nay</h2>
          {stats ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Rings: protein + calories */}
              <div className="flex items-center justify-around gap-2">
                <GlowAlert active={proteinLow} className="p-1">
                  <RingGauge
                    label="Protein"
                    value={stats.consumed.protein}
                    target={stats.targets.proteinTarget}
                    unit="g"
                    color="var(--primary)"
                  />
                </GlowAlert>
                <RingGauge
                  label="Calo"
                  value={stats.consumed.kcal}
                  target={stats.targets.kcalTarget}
                  color="var(--secondary)"
                />
              </div>
              {/* Bars: carb + fat */}
              <div className="flex flex-col justify-center gap-4">
                <AnimatedBar
                  label="Carb"
                  value={stats.consumed.carb}
                  target={stats.targets.carbTarget}
                  unit="g"
                  color="var(--secondary)"
                />
                <AnimatedBar
                  label="Fat"
                  value={stats.consumed.fat}
                  target={stats.targets.fatTarget}
                  unit="g"
                  color="var(--warning)"
                />
                {proteinLow && (
                  <p className="rounded-lg bg-secondary-soft px-3 py-2 text-xs text-secondary">
                    💪 Bạn chưa nạp đủ protein hôm nay, cố thêm chút nữa nhé!
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Đang tải...</p>
          )}
        </motion.section>
      </motion.div>

      {/* Thực đơn hôm nay */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="card mt-4 rounded-2xl p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Thực đơn hôm nay</h2>
          <Link
            href="/planner"
            className="text-sm font-medium text-primary-dark"
          >
            Chi tiết →
          </Link>
        </div>

        {plan && plan.items.length > 0 ? (
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid gap-2 lg:grid-cols-2"
          >
            {MEAL_ORDER.map((meal) => {
              const item = plan.items.find((i) => i.mealType === meal);
              if (!item) return null;
              const eaten = loggedMeals.has(meal);
              return (
                <motion.li
                  key={meal}
                  variants={popIn}
                  whileHover={{ y: -3 }}
                  className="flex items-center gap-3 rounded-xl bg-surface-2/60 px-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted">{MEAL_LABELS[meal]}</p>
                    <p className="truncate text-sm font-medium">
                      {item.dish.name}
                    </p>
                    <p className="text-xs text-muted">
                      {item.dish.protein}g protein ·{" "}
                      {formatVnd(item.estimatedCost)}
                    </p>
                  </div>
                  <motion.button
                    disabled={eaten || eatMutation.isPending}
                    whileTap={{ scale: 0.9 }}
                    animate={eaten ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                    transition={{ duration: 0.4 }}
                    onClick={() =>
                      eatMutation.mutate({
                        mealType: meal,
                        dishId: item.dish.id,
                      })
                    }
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${
                      eaten
                        ? "bg-primary-soft text-primary-dark"
                        : "bg-primary text-white"
                    }`}
                  >
                    {eaten ? "Đã ăn ✓" : "Đã ăn?"}
                  </motion.button>
                </motion.li>
              );
            })}
          </motion.ul>
        ) : (
          <div className="py-6 text-center">
            <p className="mb-3 text-sm text-muted">Chưa có thực đơn cho hôm nay</p>
            <Link
              href="/planner"
              className="inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white"
            >
              Tạo thực đơn ngay 🍱
            </Link>
          </div>
        )}
        {eatMutation.isError && (
          <p className="mt-2 text-xs text-warning">
            {eatMutation.error instanceof ApiError
              ? eatMutation.error.message
              : "Không thể ghi nhận, thử lại"}
          </p>
        )}
      </motion.section>
    </main>
  );
}
