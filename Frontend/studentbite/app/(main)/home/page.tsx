"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Banner from "@/components/ui/Banner";
import Board from "@/components/ui/Board";
import Button, { buttonClass } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import MealRow from "@/components/ui/MealRow";
import Meter from "@/components/ui/Meter";
import PageHeader from "@/components/ui/PageHeader";
import SignPanel from "@/components/ui/SignPanel";
import Skeleton, { SkeletonRows } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api";
import { formatVnd, toDateStr } from "@/lib/format";
import { useLogout, useMe } from "@/lib/hooks";
import {
  MEAL_LABELS,
  MEAL_ORDER,
  type IDailyStats,
  type IDayLog,
  type IDayPlan,
  type IProfile,
} from "@/lib/types";

/** Giờ máy người dùng là thứ React không quản — đọc qua useSyncExternalStore. */
const noopSubscribe = () => () => {};

function greetingNow(): string {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** Lời chào theo giờ; lúc render trên server chưa biết giờ nên chào trung tính. */
function useGreeting(): string {
  return useSyncExternalStore(noopSubscribe, greetingNow, () => "Chào bạn");
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useMe();
  const logout = useLogout();
  const greeting = useGreeting();
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

  const hasProfile = !!profileQuery.data?.profile;

  const statsQuery = useQuery({
    queryKey: ["stats-daily", today],
    queryFn: () => api.get<IDailyStats>(`/stats/daily?date=${today}`),
    enabled: hasProfile,
  });

  const planQuery = useQuery({
    queryKey: ["plan", today],
    queryFn: () => api.get<{ plan: IDayPlan | null }>(`/planner?date=${today}`),
    enabled: hasProfile,
  });

  const logsQuery = useQuery({
    queryKey: ["logs-day", today],
    queryFn: () => api.get<{ logs: IDayLog[] }>(`/logs/day/${today}`),
    enabled: hasProfile,
  });

  const eatMutation = useMutation({
    mutationFn: (input: { mealType: string; dishId: number; name: string }) =>
      api.post("/logs", {
        date: today,
        mealType: input.mealType,
        dishId: input.dishId,
      }),
    // Đánh dấu "đã ăn" phải phản hồi ngay, không đợi vòng mạng.
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["logs-day", today] });
      const previous = queryClient.getQueryData<{ logs: IDayLog[] }>([
        "logs-day",
        today,
      ]);
      queryClient.setQueryData<{ logs: IDayLog[] }>(
        ["logs-day", today],
        (old) => ({
          logs: [
            ...(old?.logs ?? []),
            {
              id: -Date.now(),
              mealType: input.mealType as IDayLog["mealType"],
              name: input.name,
              protein: 0,
              carb: 0,
              fat: 0,
              kcal: 0,
              cost: 0,
              eatenAt: new Date().toISOString(),
            },
          ],
        }),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["logs-day", today], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["stats-daily"] });
      void queryClient.invalidateQueries({ queryKey: ["logs-day"] });
      void queryClient.invalidateQueries({ queryKey: ["logs-month"] });
    },
  });

  const stats = statsQuery.data;
  const plan = planQuery.data?.plan ?? null;
  const logs = logsQuery.data?.logs ?? [];
  const loggedMeals = new Set(logs.map((l) => l.mealType));
  const budgetLeft = stats ? stats.targets.dailyBudget - stats.consumed.cost : 0;
  const overBudget = budgetLeft < 0;
  const proteinLeft = stats
    ? Math.max(stats.targets.proteinTarget - stats.consumed.protein, 0)
    : 0;

  return (
    <main>
      <PageHeader
        eyebrow="StudentBites"
        title={`${greeting}, ${user?.name ?? ""}`}
        actions={
          /* Trên desktop hồ sơ và đăng xuất đã nằm ở thanh bên. */
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/onboarding"
              title="Cập nhật hồ sơ"
              className="flex size-9 items-center justify-center border-2 border-panel/30 text-panel/70 transition-colors hover:border-sign hover:text-sign"
            >
              <Icon name="user" className="size-4" title="Cập nhật hồ sơ" />
            </Link>
            <button
              onClick={() => logout.mutate()}
              title="Đăng xuất"
              className="flex size-9 items-center justify-center border-2 border-panel/30 text-panel/70 transition-colors hover:border-chili hover:text-chili"
            >
              <Icon name="logout" className="size-4" title="Đăng xuất" />
            </button>
          </div>
        }
      />

      <div className="px-4 pt-4 lg:px-6 lg:pt-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {/* Số dư ngày — tấm biển duy nhất của màn hình */}
          <section>
            {stats ? (
              <SignPanel tone={overBudget ? "chili" : "sign"}>
                <p className="label opacity-70">
                  {overBudget ? "Đã vượt ngân sách ngày" : "Còn lại hôm nay"}
                </p>
                <p className="disp-num mt-1.5 text-[2.6rem] lg:text-[2.9rem]">
                  {formatVnd(Math.abs(budgetLeft))}
                </p>
                <div
                  className={`my-2.5 h-0.5 ${overBudget ? "bg-panel/60" : "bg-ink"}`}
                />
                <div className="num flex justify-between text-[0.7rem] font-bold">
                  <span>Đã chi {formatVnd(stats.consumed.cost)}</span>
                  <span className="opacity-70">
                    Hạn mức {formatVnd(stats.targets.dailyBudget)}
                  </span>
                </div>
              </SignPanel>
            ) : (
              <Skeleton className="h-36 w-full" />
            )}

            {/* Backend đã chia sẵn hạn mức theo từng bữa — hiện ra để biết
                bữa tới được tiêu bao nhiêu, khỏi phải tự nhẩm. */}
            {stats && (
              <div className="mt-5">
                <p className="label mb-1 text-panel/50">Hạn mức từng bữa</p>
                {MEAL_ORDER.map((meal) => (
                  <div
                    key={meal}
                    className="rule-soft flex items-baseline justify-between py-1.5 first:border-t-0"
                  >
                    <span className="text-[0.78rem] font-semibold text-panel/80">
                      {MEAL_LABELS[meal]}
                    </span>
                    <span className="num text-[0.82rem] font-bold">
                      {formatVnd(stats.targets.mealBudgets[meal])}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Dinh dưỡng hôm nay */}
          <Board title="Dinh dưỡng" icon="target" aside="Hôm nay">
            {stats ? (
              <>
                <Meter
                  label="Protein"
                  tone="protein"
                  value={stats.consumed.protein}
                  target={stats.targets.proteinTarget}
                  unit="g"
                />
                <Meter
                  label="Carb"
                  tone="carb"
                  value={stats.consumed.carb}
                  target={stats.targets.carbTarget}
                  unit="g"
                />
                <Meter
                  label="Fat"
                  tone="fat"
                  value={stats.consumed.fat}
                  target={stats.targets.fatTarget}
                  unit="g"
                />
                <Meter
                  label="Kcal"
                  tone="kcal"
                  value={stats.consumed.kcal}
                  target={stats.targets.kcalTarget}
                />
                {stats.proteinWarning && proteinLeft > 0 && (
                  <Banner tone="warn" className="mt-3">
                    Còn thiếu {Math.round(proteinLeft)}g protein. Bữa tới chọn
                    món đạm cao là vừa đủ.
                  </Banner>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            )}
          </Board>

          {/* Thực đơn hôm nay */}
          <Board
            title="Thực đơn"
            icon="bowl"
            className="md:col-span-2 lg:col-span-1"
            aside={
              plan && plan.items.length > 0 ? (
                <Link href="/planner" className="hover:text-sign">
                  Chi tiết →
                </Link>
              ) : undefined
            }
          >
            {planQuery.isPending ? (
              <SkeletonRows rows={3} />
            ) : plan && plan.items.length > 0 ? (
              <>
                {MEAL_ORDER.map((meal) => {
                  const item = plan.items.find((i) => i.mealType === meal);
                  if (!item) return null;
                  const eaten = loggedMeals.has(meal);
                  return (
                    <MealRow
                      key={meal}
                      mealType={meal}
                      name={item.dish.name}
                      detail={`${item.dish.protein}g protein · ${item.dish.kcal} kcal`}
                      cost={item.estimatedCost}
                      muted={eaten}
                      action={
                        eaten ? (
                          <span className="disp inline-flex items-center gap-1 border-2 border-sign px-2 py-1 text-[0.55rem] tracking-widest text-sign">
                            <Icon
                              name="check"
                              className="size-3"
                              strokeWidth={3}
                            />
                            Đã ăn
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={eatMutation.isPending}
                            onClick={() =>
                              eatMutation.mutate({
                                mealType: meal,
                                dishId: item.dish.id,
                                name: item.dish.name,
                              })
                            }
                          >
                            Đánh dấu
                          </Button>
                        )
                      }
                    />
                  );
                })}
                {eatMutation.isError && (
                  <Banner tone="critical" className="mt-3">
                    {eatMutation.error instanceof ApiError
                      ? eatMutation.error.message
                      : "Không ghi nhận được. Kiểm tra mạng rồi bấm lại."}
                  </Banner>
                )}
              </>
            ) : (
              <EmptyState
                icon="bowl"
                title="Hôm nay chưa có thực đơn"
                hint="Tạo thực đơn để biết ăn gì, hết bao nhiêu, đủ đạm chưa."
                action={
                  <Link href="/planner" className={buttonClass("primary", "md")}>
                    <Icon name="dice" className="size-4" />
                    Lên thực đơn
                  </Link>
                }
              />
            )}
          </Board>
        </div>
      </div>
    </main>
  );
}
