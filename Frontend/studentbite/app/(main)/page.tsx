"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import ProgressBar from "@/components/ProgressBar";
import { api, ApiError } from "@/lib/api";
import { formatVnd, toDateStr } from "@/lib/format";
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
    queryFn: () =>
      api.get<{ logs: IDayLog[] }>(`/logs/day/${today}`),
    enabled: !!profileQuery.data?.profile,
  });

  const eatMutation = useMutation({
    mutationFn: (input: { mealType: string; dishId: number }) =>
      api.post("/logs", { date: today, ...input }),
    onSuccess: () => {
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
  const budgetLeft = stats
    ? stats.targets.dailyBudget - stats.consumed.cost
    : 0;

  return (
    <main className="px-4 pt-6">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Chào buổi sáng 👋</p>
          <h1 className="text-xl font-bold">{user?.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/onboarding"
            className="rounded-full bg-white p-2.5 text-lg shadow-sm"
            title="Cập nhật hồ sơ"
          >
            ⚙️
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            className="rounded-full bg-white p-2.5 text-lg shadow-sm"
            title="Đăng xuất"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Ngân sách hôm nay */}
      {stats && (
        <section className="mb-4 rounded-2xl bg-green-600 p-5 text-white shadow-lg shadow-green-600/20">
          <p className="text-sm/none opacity-80">Ngân sách hôm nay còn</p>
          <p className="mt-2 text-3xl font-bold">
            {formatVnd(Math.max(budgetLeft, 0))}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs opacity-90">
            <span>Đã chi: {formatVnd(stats.consumed.cost)}</span>
            <span>Tổng: {formatVnd(stats.targets.dailyBudget)}/ngày</span>
          </div>
          {stats.budgetWarning && (
            <p className="mt-3 rounded-lg bg-white/20 px-3 py-2 text-xs font-medium">
              ⚠️ Hôm nay bạn đã chi vượt ngân sách ngày!
            </p>
          )}
        </section>
      )}

      {/* Dinh dưỡng hôm nay */}
      <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Dinh dưỡng hôm nay</h2>
        {stats ? (
          <div className="space-y-3.5">
            <ProgressBar
              label="Protein"
              value={stats.consumed.protein}
              target={stats.targets.proteinTarget}
              unit="g"
              color="bg-green-500"
            />
            <ProgressBar
              label="Carb"
              value={stats.consumed.carb}
              target={stats.targets.carbTarget}
              unit="g"
              color="bg-amber-400"
            />
            <ProgressBar
              label="Fat"
              value={stats.consumed.fat}
              target={stats.targets.fatTarget}
              unit="g"
              color="bg-rose-400"
            />
            <ProgressBar
              label="Calories"
              value={stats.consumed.kcal}
              target={stats.targets.kcalTarget}
              unit=" kcal"
              color="bg-sky-500"
            />
            {stats.proteinWarning && stats.consumed.kcal > 0 && (
              <p className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-600">
                💪 Bạn chưa nạp đủ protein hôm nay, cố thêm chút nữa nhé!
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Đang tải...</p>
        )}
      </section>

      {/* Thực đơn hôm nay */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Thực đơn hôm nay</h2>
          <Link href="/planner" className="text-sm font-medium text-green-600">
            Chi tiết →
          </Link>
        </div>

        {plan && plan.items.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {MEAL_ORDER.map((meal) => {
              const item = plan.items.find((i) => i.mealType === meal);
              if (!item) return null;
              const eaten = loggedMeals.has(meal);
              return (
                <li key={meal} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400">
                      {MEAL_LABELS[meal]}
                    </p>
                    <p className="truncate text-sm font-medium">
                      {item.dish.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.dish.protein}g protein ·{" "}
                      {formatVnd(item.estimatedCost)}
                    </p>
                  </div>
                  <button
                    disabled={eaten || eatMutation.isPending}
                    onClick={() =>
                      eatMutation.mutate({
                        mealType: meal,
                        dishId: item.dish.id,
                      })
                    }
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                      eaten
                        ? "bg-green-100 text-green-600"
                        : "bg-green-600 text-white active:scale-95"
                    }`}
                  >
                    {eaten ? "Đã ăn ✓" : "Đã ăn?"}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-6 text-center">
            <p className="mb-3 text-sm text-gray-500">
              Chưa có thực đơn cho hôm nay
            </p>
            <Link
              href="/planner"
              className="inline-block rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white"
            >
              Tạo thực đơn ngay 🍱
            </Link>
          </div>
        )}
        {eatMutation.isError && (
          <p className="mt-2 text-xs text-red-500">
            {eatMutation.error instanceof ApiError
              ? eatMutation.error.message
              : "Không thể ghi nhận, thử lại"}
          </p>
        )}
      </section>
    </main>
  );
}
