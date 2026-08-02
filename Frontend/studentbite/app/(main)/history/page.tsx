"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "@/lib/api";
import { formatDateVi, formatVnd, toDateStr } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import CountUp from "@/components/CountUp";
import {
  MEAL_LABELS,
  type IDayLog,
  type IMonthDay,
  type ISpendingStats,
} from "@/lib/types";

/** "YYYY-MM" hiện tại */
function toMonthStr(d: Date = new Date()): string {
  return toDateStr(d).slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthStr(d);
}

/** Ma trận tuần của tháng (mỗi ô là "YYYY-MM-DD" hoặc null). */
function monthGrid(month: string): (string | null)[][] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const startCol = (first.getDay() + 6) % 7; // Thứ 2 là cột đầu
  const weeks: (string | null)[][] = [];
  let week: (string | null)[] = Array(startCol).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(`${month}-${String(day).padStart(2, "0")}`);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  return weeks;
}

export default function HistoryPage() {
  const [tab, setTab] = useState<"calendar" | "stats">("calendar");
  const [month, setMonth] = useState(toMonthStr());
  const [selectedDate, setSelectedDate] = useState(toDateStr());
  const [range, setRange] = useState<"week" | "month">("week");
  const [expanded, setExpanded] = useState<number | null>(null);
  const today = toDateStr();

  const monthQuery = useQuery({
    queryKey: ["logs-month", month],
    queryFn: () =>
      api.get<{ month: string; days: IMonthDay[] }>(`/logs?month=${month}`),
  });

  const dayQuery = useQuery({
    queryKey: ["logs-day", selectedDate],
    queryFn: () => api.get<{ logs: IDayLog[] }>(`/logs/day/${selectedDate}`),
    enabled: tab === "calendar",
  });

  const spendingQuery = useQuery({
    queryKey: ["spending", range],
    queryFn: () =>
      api.get<ISpendingStats>(`/stats/spending?range=${range}&end=${today}`),
    enabled: tab === "stats",
  });

  const dayMap = new Map((monthQuery.data?.days ?? []).map((d) => [d.date, d]));
  const logs = dayQuery.data?.logs ?? [];
  const spending = spendingQuery.data;
  const chartData = (spending?.days ?? []).map((d) => ({
    ...d,
    label: d.date.slice(8, 10) + "/" + d.date.slice(5, 7),
    over: d.spent > d.budget,
  }));

  return (
    <main className="px-4 pt-6 lg:px-8">
      <motion.h1
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-4 text-xl font-bold lg:text-2xl"
      >
        Lịch sử 📅
      </motion.h1>

      {/* Tab switch */}
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-surface-2 p-1 sm:max-w-md">
        {(
          [
            ["calendar", "Nhật ký ăn uống"],
            ["stats", "Thống kê chi tiêu"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative rounded-lg py-2 text-sm font-medium transition ${
              tab === key ? "text-foreground" : "text-muted"
            }`}
          >
            {tab === key && (
              <motion.span
                layoutId="history-tab-pill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-surface shadow-sm"
              />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {tab === "calendar" && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 lg:grid-cols-2"
        >
          {/* Calendar */}
          <motion.section variants={fadeInUp} className="card rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setMonth(shiftMonth(month, -1))}
                className="rounded-lg px-3 py-1 text-muted"
              >
                ←
              </button>
              <p className="font-semibold">
                Tháng {Number(month.slice(5, 7))}/{month.slice(0, 4)}
              </p>
              <button
                onClick={() => setMonth(shiftMonth(month, 1))}
                className="rounded-lg px-3 py-1 text-muted"
              >
                →
              </button>
            </div>
            <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-muted">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            {monthGrid(month).map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-y-1">
                {week.map((date, di) =>
                  date ? (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date);
                        setExpanded(null);
                      }}
                      className={`mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-xl text-sm transition ${
                        selectedDate === date
                          ? "bg-primary font-bold text-white"
                          : date === today
                            ? "bg-primary-soft font-semibold text-primary-dark"
                            : "text-foreground/80 hover:bg-surface-2"
                      }`}
                    >
                      {Number(date.slice(8, 10))}
                      {dayMap.has(date) && (
                        <span
                          className={`h-1 w-1 rounded-full ${
                            selectedDate === date ? "bg-white" : "bg-primary"
                          }`}
                        />
                      )}
                    </button>
                  ) : (
                    <span key={`e${wi}-${di}`} />
                  ),
                )}
              </div>
            ))}
          </motion.section>

          {/* Chi tiết ngày — accordion rows */}
          <motion.section variants={fadeInUp} className="card rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">{formatDateVi(selectedDate)}</h2>
              {dayMap.has(selectedDate) && (
                <span className="text-sm font-bold text-primary-dark">
                  {formatVnd(dayMap.get(selectedDate)!.cost)}
                </span>
              )}
            </div>
            {logs.length > 0 ? (
              <>
                <p className="mb-3 text-xs text-muted">
                  {dayMap.get(selectedDate)?.protein ?? 0}g protein ·{" "}
                  {dayMap.get(selectedDate)?.kcal ?? 0} kcal · {logs.length} bữa
                </p>
                <motion.ul
                  key={selectedDate}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="space-y-1.5"
                >
                  {logs.map((log) => {
                    const open = expanded === log.id;
                    return (
                      <motion.li
                        key={log.id}
                        variants={fadeInUp}
                        className="overflow-hidden rounded-xl bg-surface-2/60"
                      >
                        <button
                          onClick={() => setExpanded(open ? null : log.id)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted">
                              {MEAL_LABELS[log.mealType]}
                            </p>
                            <p className="truncate text-sm font-medium">
                              {log.name}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold">
                            {formatVnd(log.cost)}
                          </span>
                          <motion.span
                            animate={{ rotate: open ? 180 : 0 }}
                            className="shrink-0 text-xs text-muted"
                          >
                            ▾
                          </motion.span>
                        </button>
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                              <div className="grid grid-cols-4 gap-2 px-3 pb-3 pt-1 text-center">
                                {[
                                  ["Protein", `${log.protein}g`],
                                  ["Carb", `${log.carb}g`],
                                  ["Fat", `${log.fat}g`],
                                  ["Calo", `${log.kcal}`],
                                ].map(([k, v]) => (
                                  <div
                                    key={k}
                                    className="rounded-lg bg-surface py-1.5"
                                  >
                                    <p className="text-[10px] text-muted">{k}</p>
                                    <p className="text-xs font-bold">{v}</p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </>
            ) : (
              <p className="py-4 text-center text-sm text-muted">
                Chưa ghi nhận bữa nào trong ngày này
              </p>
            )}
          </motion.section>
        </motion.div>
      )}

      {tab === "stats" && (
        <>
          <div className="mb-4 flex gap-2">
            {(
              [
                ["week", "7 ngày"],
                ["month", "30 ngày"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${
                  range === key ? "text-white" : "card text-muted"
                }`}
              >
                {range === key && (
                  <motion.span
                    layoutId="history-range-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          {spending && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 grid grid-cols-2 gap-3 sm:max-w-lg"
            >
              <div className="card rounded-2xl p-4">
                <p className="text-xs text-muted">Đã chi tiêu</p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    spending.totalSpent > spending.totalBudget
                      ? "text-warning"
                      : "text-foreground"
                  }`}
                >
                  <CountUp value={spending.totalSpent} format={formatVnd} />
                </p>
              </div>
              <div className="card rounded-2xl p-4">
                <p className="text-xs text-muted">Ngân sách kỳ này</p>
                <p className="mt-1 text-lg font-bold text-primary-dark">
                  <CountUp value={spending.totalBudget} format={formatVnd} />
                </p>
              </div>
            </motion.section>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Biểu đồ chi tiêu vs ngân sách (bars grow từ 0, stagger) */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="card rounded-2xl p-4"
            >
              <h2 className="mb-3 text-sm font-semibold">
                Chi tiêu vs ngân sách ngày
              </h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      width={44}
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip
                      formatter={(value) => formatVnd(Number(value))}
                      labelFormatter={(label) => `Ngày ${label}`}
                    />
                    <Bar
                      dataKey="spent"
                      name="Đã chi"
                      radius={[3, 3, 0, 0]}
                      animationBegin={100}
                      animationDuration={900}
                    >
                      {chartData.map((d, i) => (
                        <Cell
                          key={i}
                          fill={d.over ? "#f43f5e" : "#10b981"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-center text-[11px] text-muted">
                Ngân sách/ngày: {formatVnd(spending?.days[0]?.budget ?? 0)}
              </p>
            </motion.section>

            {/* Protein theo ngày trong tháng */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="card rounded-2xl p-4"
            >
              <h2 className="mb-3 text-sm font-semibold">
                Protein theo ngày (tháng này)
              </h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(monthQuery.data?.days ?? []).map((d) => ({
                      ...d,
                      label: Number(d.date.slice(8, 10)),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={30} />
                    <Tooltip
                      formatter={(value) => `${value}g protein`}
                      labelFormatter={(label) => `Ngày ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="protein"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      animationDuration={900}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.section>
          </div>
        </>
      )}
    </main>
  );
}
