"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Banner from "@/components/ui/Banner";
import Board from "@/components/ui/Board";
import { buttonClass } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import PageHeader from "@/components/ui/PageHeader";
import SignPanel from "@/components/ui/SignPanel";
import Skeleton from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatDateVi, toDateStr } from "@/lib/format";
import type { IMonthDay } from "@/lib/types";

/** Số bữa tối thiểu để coi là hoàn thành ngày (sáng + trưa + tối). */
const DONE_MEALS = 3;

function toMonthStr(d: Date = new Date()): string {
  return toDateStr(d).slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  return toMonthStr(new Date(y, m - 1 + delta, 1));
}

function prevMonth(month: string): string {
  return shiftMonth(month, -1);
}

/** Ma trận tuần của tháng (Thứ 2 đầu tuần). */
function monthGrid(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const startCol = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = Array(startCol).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function shiftDate(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

function isDone(day: IMonthDay | undefined): boolean {
  return (day?.meals ?? 0) >= DONE_MEALS;
}

function isPartial(day: IMonthDay | undefined): boolean {
  const meals = day?.meals ?? 0;
  return meals > 0 && meals < DONE_MEALS;
}

/** Chuỗi ngày hoàn thành liên tiếp, tính từ hôm nay (hoặc hôm qua nếu hôm nay chưa xong). */
function calcStreak(
  dayMap: Map<string, IMonthDay>,
  today: string,
): number {
  let cursor = today;
  if (!isDone(dayMap.get(today))) {
    cursor = shiftDate(today, -1);
  }
  let streak = 0;
  while (isDone(dayMap.get(cursor))) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

function motivate(streak: number, todayDone: boolean, monthDone: number): string {
  if (streak === 0 && monthDone === 0) {
    return "Bắt đầu chuỗi đầu tiên hôm nay — đánh dấu đủ bữa trên Trang chủ để ô đầu tiên sáng lên.";
  }
  if (!todayDone && streak > 0) {
    return `Bạn đang giữ ${streak} ngày liên tiếp. Đánh dấu đủ bữa hôm nay để không đứt chuỗi!`;
  }
  if (streak >= 14) {
    return `Tuyệt vời — ${streak} ngày liền! Cơ thể đang quen với nhịp ăn đủ chất.`;
  }
  if (streak >= 7) {
    return `Một tuần tròn! Giữ nhịp này, thực đơn sẽ dễ theo hơn mỗi ngày.`;
  }
  if (streak >= 3) {
    return `${streak} ngày liên tiếp rồi — đà tốt, đừng bỏ lỡ hôm nay.`;
  }
  if (todayDone) {
    return "Hôm nay đã hoàn thành. Quay lại mai để nối dài chuỗi theo dõi.";
  }
  return "Mỗi ô vàng là một ngày bạn giữ đúng thực đơn — tô dần bảng carô này nhé.";
}

export default function TrackingPage() {
  const today = toDateStr();
  const [month, setMonth] = useState(toMonthStr());

  const currentMonthQuery = useQuery({
    queryKey: ["logs-month", month],
    queryFn: () =>
      api.get<{ month: string; days: IMonthDay[] }>(`/logs?month=${month}`),
  });

  const streakMonth = toMonthStr();
  const streakPrev = prevMonth(streakMonth);

  const streakMonthQuery = useQuery({
    queryKey: ["logs-month", streakMonth],
    queryFn: () =>
      api.get<{ month: string; days: IMonthDay[] }>(
        `/logs?month=${streakMonth}`,
      ),
  });

  const streakPrevQuery = useQuery({
    queryKey: ["logs-month", streakPrev],
    queryFn: () =>
      api.get<{ month: string; days: IMonthDay[] }>(
        `/logs?month=${streakPrev}`,
      ),
    // Chỉ cần tháng trước khi chuỗi có thể kéo dài qua biên tháng.
    enabled: true,
  });

  const dayMap = useMemo(() => {
    const map = new Map<string, IMonthDay>();
    for (const d of streakPrevQuery.data?.days ?? []) map.set(d.date, d);
    for (const d of streakMonthQuery.data?.days ?? []) map.set(d.date, d);
    // Tháng đang xem trên bảng (có thể khác tháng hiện tại)
    for (const d of currentMonthQuery.data?.days ?? []) map.set(d.date, d);
    return map;
  }, [
    streakPrevQuery.data,
    streakMonthQuery.data,
    currentMonthQuery.data,
  ]);

  const streakReady =
    !streakMonthQuery.isPending && !streakPrevQuery.isPending;
  const streak = streakReady ? calcStreak(dayMap, today) : 0;
  const todayDone = isDone(dayMap.get(today));
  const todayPartial = isPartial(dayMap.get(today));

  const viewDays = currentMonthQuery.data?.days ?? [];
  const viewDone = viewDays.filter((d) => isDone(d)).length;
  const viewPartial = viewDays.filter((d) => isPartial(d)).length;

  const thisMonthDays = streakMonthQuery.data?.days ?? [];
  const monthDone = thisMonthDays.filter((d) => isDone(d)).length;
  const daysElapsed = Number(today.slice(8, 10));

  const bestHint = motivate(streak, todayDone, monthDone);
  const loading =
    currentMonthQuery.isPending ||
    streakMonthQuery.isPending ||
    streakPrevQuery.isPending;

  return (
    <main>
      <PageHeader title="Theo dõi" eyebrow="Chuỗi thực đơn" />

      <div className="anim-rise-sm anim-delay-1 px-4 pt-3 lg:px-6 lg:pt-5">
        <div className="stagger-in grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-8">
          {/* --- Hero chuỗi ngày --- */}
          <div className="grid gap-4">
            <SignPanel tone={todayDone ? "sign" : streak > 0 ? "panel" : "chili"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label opacity-70">Chuỗi ngày hoàn thành</p>
                  {loading ? (
                    <Skeleton className="mt-2 h-12 w-24 bg-ink/15" />
                  ) : (
                    <p className="disp-num mt-1 text-[3.2rem] leading-none tracking-tight">
                      {streak}
                      <span className="disp ml-2 text-[1rem] tracking-widest opacity-70">
                        ngày
                      </span>
                    </p>
                  )}
                </div>
                <Icon name="streak" className="size-9 opacity-80" strokeWidth={2.2} />
              </div>
              <p className="mt-3 text-[0.78rem] leading-snug font-semibold opacity-85">
                {loading ? "Đang tải chuỗi theo dõi…" : bestHint}
              </p>
            </SignPanel>

            <div className="grid grid-cols-2 gap-2">
              <div className="border-2 border-panel/25 bg-enamel-deep px-3 py-3">
                <p className="label text-panel/50">Tháng này đã xong</p>
                {loading ? (
                  <Skeleton className="mt-2 h-7 w-16" />
                ) : (
                  <p className="disp-num mt-1 text-[1.45rem] text-mint">
                    {monthDone}
                    <span className="text-[0.75rem] text-panel/45">
                      {" "}
                      / {daysElapsed}
                    </span>
                  </p>
                )}
              </div>
              <div className="border-2 border-panel/25 bg-enamel-deep px-3 py-3">
                <p className="label text-panel/50">Hôm nay</p>
                {loading ? (
                  <Skeleton className="mt-2 h-7 w-20" />
                ) : (
                  <p
                    className={`disp mt-1.5 text-[0.95rem] tracking-widest ${
                      todayDone
                        ? "text-sign"
                        : todayPartial
                          ? "text-mango"
                          : "text-panel/55"
                    }`}
                  >
                    {todayDone
                      ? "Đã hoàn thành"
                      : todayPartial
                        ? "Còn thiếu bữa"
                        : "Chưa ghi nhận"}
                  </p>
                )}
              </div>
            </div>

            {!todayDone && (
              <Banner tone={todayPartial ? "warn" : "critical"}>
                {todayPartial
                  ? "Còn thiếu bữa — vào Trang chủ đánh dấu đủ sáng, trưa, tối để tô ô hôm nay."
                  : "Hôm nay chưa có bữa nào được đánh dấu. Một cú chạm trên Trang chủ là bắt đầu chuỗi."}
              </Banner>
            )}
            {todayDone && (
              <Banner tone="good">
                Hôm nay đã đủ {DONE_MEALS} bữa — ô trên bảng carô đã sáng. Mai nhớ quay lại!
              </Banner>
            )}

            <div className="flex flex-wrap gap-2">
              <Link href="/home" className={buttonClass("primary")}>
                <Icon name="check" className="size-4" />
                Đánh dấu bữa hôm nay
              </Link>
              <Link href="/planner" className={buttonClass("ghost")}>
                <Icon name="bowl" className="size-4" />
                Xem thực đơn
              </Link>
            </div>
          </div>

          {/* --- Bảng carô tháng --- */}
          <Board
            title="Bảng carô"
            icon="calendar"
            aside={`Tháng ${Number(month.slice(5, 7))}/${month.slice(0, 4)}`}
          >
            <div className="border-2 border-panel/25 bg-enamel-deep px-3 py-3">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMonth(shiftMonth(month, -1))}
                  aria-label="Tháng trước"
                  className="border-2 border-panel/25 p-1.5 text-panel/70 transition-colors hover:border-sign hover:text-sign"
                >
                  <Icon name="chevronLeft" className="size-4" />
                </button>
                <p className="disp text-[0.95rem] tracking-widest text-sign">
                  Tháng {Number(month.slice(5, 7))} / {month.slice(0, 4)}
                </p>
                <button
                  type="button"
                  onClick={() => setMonth(shiftMonth(month, 1))}
                  aria-label="Tháng sau"
                  disabled={month >= toMonthStr()}
                  className="border-2 border-panel/25 p-1.5 text-panel/70 transition-colors hover:border-sign hover:text-sign disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Icon name="chevronRight" className="size-4" />
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 text-center">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                  <span key={d} className="label text-panel/40">
                    {d}
                  </span>
                ))}
              </div>

              {currentMonthQuery.isPending ? (
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1.5">
                  {monthGrid(month).map((date, i) => {
                    if (!date) {
                      return <span key={`empty-${i}`} className="aspect-square" />;
                    }
                    const day = dayMap.get(date);
                    const done = isDone(day);
                    const partial = isPartial(day);
                    const future = date > today;
                    const isToday = date === today;

                    return (
                      <div
                        key={date}
                        title={
                          future
                            ? `${formatDateVi(date)} — chưa tới`
                            : done
                              ? `${formatDateVi(date)} — hoàn thành (${day?.meals ?? 0} bữa)`
                              : partial
                                ? `${formatDateVi(date)} — còn thiếu (${day?.meals ?? 0}/${DONE_MEALS} bữa)`
                                : `${formatDateVi(date)} — chưa hoàn thành`
                        }
                        className={`num relative flex aspect-square flex-col items-center justify-center border-2 text-[0.72rem] font-bold transition-colors ${
                          future
                            ? "border-panel/10 bg-transparent text-panel/25"
                            : done
                              ? "border-ink bg-sign text-ink shadow-hard-sm"
                              : partial
                                ? "border-ink bg-mint text-ink"
                                : isToday
                                  ? "border-sign bg-transparent text-sign"
                                  : "border-panel/20 bg-enamel/40 text-panel/40"
                        }`}
                      >
                        {Number(date.slice(8, 10))}
                        {done && (
                          <Icon
                            name="check"
                            className="absolute right-0.5 bottom-0.5 size-2.5 opacity-70"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-panel/70">
                  <span className="size-3 border-2 border-ink bg-sign" />
                  Đủ {DONE_MEALS} bữa
                </span>
                <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-panel/70">
                  <span className="size-3 border-2 border-ink bg-mint" />
                  Thiếu bữa
                </span>
                <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-panel/70">
                  <span className="size-3 border-2 border-panel/25 bg-enamel/40" />
                  Chưa ghi
                </span>
              </div>
            </div>

            {!currentMonthQuery.isPending &&
              viewDone === 0 &&
              viewPartial === 0 &&
              month <= toMonthStr() && (
              <div className="mt-4">
                <EmptyState
                  icon="streak"
                  title="Bảng carô còn trống"
                  hint="Mỗi ngày đánh dấu đủ bữa sáng, trưa, tối trên Trang chủ sẽ tô một ô vàng."
                />
              </div>
            )}
          </Board>
        </div>
      </div>
    </main>
  );
}
