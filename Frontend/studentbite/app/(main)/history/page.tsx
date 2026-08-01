"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "@/lib/api";
import { formatDateVi, formatVnd, toDateStr } from "@/lib/format";
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
  // Thứ 2 là cột đầu
  const startCol = (first.getDay() + 6) % 7;
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

  const dayMap = new Map(
    (monthQuery.data?.days ?? []).map((d) => [d.date, d]),
  );
  const logs = dayQuery.data?.logs ?? [];
  const spending = spendingQuery.data;
  const chartData = (spending?.days ?? []).map((d) => ({
    ...d,
    label: d.date.slice(8, 10) + "/" + d.date.slice(5, 7),
  }));

  return (
    <main className="px-4 pt-6">
      <h1 className="mb-4 text-xl font-bold">Lịch sử 📅</h1>

      {/* Tab switch */}
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
        {(
          [
            ["calendar", "Nhật ký ăn uống"],
            ["stats", "Thống kê chi tiêu"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              tab === key ? "bg-white shadow-sm" : "text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "calendar" && (
        <>
          {/* Calendar */}
          <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setMonth(shiftMonth(month, -1))}
                className="rounded-lg px-3 py-1 text-gray-500"
              >
                ←
              </button>
              <p className="font-semibold">
                Tháng {Number(month.slice(5, 7))}/{month.slice(0, 4)}
              </p>
              <button
                onClick={() => setMonth(shiftMonth(month, 1))}
                className="rounded-lg px-3 py-1 text-gray-500"
              >
                →
              </button>
            </div>
            <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-gray-400">
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
                      onClick={() => setSelectedDate(date)}
                      className={`mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-xl text-sm transition ${
                        selectedDate === date
                          ? "bg-green-600 font-bold text-white"
                          : date === today
                            ? "bg-green-50 font-semibold text-green-700"
                            : "text-gray-700"
                      }`}
                    >
                      {Number(date.slice(8, 10))}
                      {dayMap.has(date) && (
                        <span
                          className={`h-1 w-1 rounded-full ${
                            selectedDate === date
                              ? "bg-white"
                              : "bg-green-500"
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
          </section>

          {/* Chi tiết ngày */}
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">{formatDateVi(selectedDate)}</h2>
              {dayMap.has(selectedDate) && (
                <span className="text-sm font-bold text-green-600">
                  {formatVnd(dayMap.get(selectedDate)!.cost)}
                </span>
              )}
            </div>
            {logs.length > 0 ? (
              <>
                <p className="mb-3 text-xs text-gray-500">
                  {dayMap.get(selectedDate)?.protein ?? 0}g protein ·{" "}
                  {dayMap.get(selectedDate)?.kcal ?? 0} kcal · {logs.length}{" "}
                  bữa
                </p>
                <ul className="divide-y divide-gray-50">
                  {logs.map((log) => (
                    <li key={log.id} className="flex items-center py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400">
                          {MEAL_LABELS[log.mealType]}
                        </p>
                        <p className="truncate text-sm font-medium">
                          {log.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          P {log.protein}g · {log.kcal} kcal
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">
                        {formatVnd(log.cost)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="py-4 text-center text-sm text-gray-400">
                Chưa ghi nhận bữa nào trong ngày này
              </p>
            )}
          </section>
        </>
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
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  range === key
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-600 shadow-sm"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {spending && (
            <section className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-400">Đã chi tiêu</p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    spending.totalSpent > spending.totalBudget
                      ? "text-red-500"
                      : "text-gray-900"
                  }`}
                >
                  {formatVnd(spending.totalSpent)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-400">Ngân sách kỳ này</p>
                <p className="mt-1 text-lg font-bold text-green-600">
                  {formatVnd(spending.totalBudget)}
                </p>
              </div>
            </section>
          )}

          {/* Biểu đồ chi tiêu vs ngân sách */}
          <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
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
                    fill="#16a34a"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-center text-[11px] text-gray-400">
              Ngân sách/ngày:{" "}
              {formatVnd(spending?.days[0]?.budget ?? 0)}
            </p>
          </section>

          {/* Protein theo ngày trong tháng */}
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">
              Protein theo ngày (tháng này)
            </h2>
            <div className="h-44">
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
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
