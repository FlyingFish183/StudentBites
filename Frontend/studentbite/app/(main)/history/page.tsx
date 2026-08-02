"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from "recharts";

import Board from "@/components/ui/Board";
import ChartTooltip from "@/components/ui/ChartTooltip";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import MealRow from "@/components/ui/MealRow";
import PageHeader from "@/components/ui/PageHeader";
import Segmented from "@/components/ui/Segmented";
import Skeleton, { SkeletonRows } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatDateVi, formatVnd, toDateStr } from "@/lib/format";
import type { IDayLog, IMonthDay, ISpendingStats } from "@/lib/types";

/* --- màu biểu đồ: lấy thẳng từ bảng màu của app --- */
const C_SIGN = "#ffce2e";
const C_CHILI = "#ee3b2e";
const C_MINT = "#5fc4a8";
const C_GRID = "rgba(251,244,226,0.10)";
const C_TICK = "rgba(251,244,226,0.45)";

interface ISpendDatum {
  date: string;
  spent: number;
  budget: number;
  label: string;
  over: boolean;
}

/**
 * Tô màu từng cột theo trạng thái vượt hạn mức. Dùng `shape` thay cho
 * <Cell> vì Cell đã bị bỏ ở Recharts 4.
 */
function renderSpendBar(props: BarShapeProps) {
  const { x, y, width, height, payload } = props;
  const over = (payload as ISpendDatum | undefined)?.over ?? false;
  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      radius={[3, 3, 0, 0]}
      fill={over ? C_CHILI : C_SIGN}
    />
  );
}

/** "YYYY-MM" hiện tại */
function toMonthStr(d: Date = new Date()): string {
  return toDateStr(d).slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  return toMonthStr(new Date(y, m - 1 + delta, 1));
}

/** Ma trận tuần của tháng (mỗi ô là "YYYY-MM-DD" hoặc null). */
function monthGrid(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  // Thứ 2 là cột đầu
  const startCol = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = Array(startCol).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
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

  const dayMap = new Map((monthQuery.data?.days ?? []).map((d) => [d.date, d]));
  const logs = dayQuery.data?.logs ?? [];
  const selectedSummary = dayMap.get(selectedDate);
  const spending = spendingQuery.data;
  const dailyBudget = spending?.days[0]?.budget ?? 0;
  const spendingData: ISpendDatum[] = (spending?.days ?? []).map((d) => ({
    ...d,
    label: `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}`,
    over: d.spent > d.budget,
  }));
  const proteinData = (monthQuery.data?.days ?? []).map((d) => ({
    ...d,
    label: Number(d.date.slice(8, 10)),
  }));

  return (
    <main>
      <PageHeader title="Lịch sử" />

      <div className="px-4 pt-3 lg:px-6 lg:pt-5">
        <Segmented
          className="mb-5 lg:max-w-sm"
          value={tab}
          onChange={setTab}
          options={[
            ["calendar", "Nhật ký ăn"],
            ["stats", "Chi tiêu"],
          ]}
        />

        {tab === "calendar" && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start lg:gap-8">
            {/* Lịch tháng */}
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
                  className="border-2 border-panel/25 p-1.5 text-panel/70 transition-colors hover:border-sign hover:text-sign"
                >
                  <Icon name="chevronRight" className="size-4" />
                </button>
              </div>

              <div className="mb-1.5 grid grid-cols-7 text-center">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                  <span key={d} className="label text-panel/40">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthGrid(month).map((date, i) =>
                  date ? (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      aria-current={date === selectedDate ? "date" : undefined}
                      className={`num flex aspect-square flex-col items-center justify-center border-2 text-[0.78rem] font-bold transition-colors ${
                        selectedDate === date
                          ? "border-ink bg-sign text-ink"
                          : date === today
                            ? "border-sign text-sign"
                            : "border-transparent text-panel/70 hover:border-panel/30"
                      }`}
                    >
                      {Number(date.slice(8, 10))}
                      <span
                        className={`mt-0.5 size-1 ${
                          !dayMap.has(date)
                            ? "bg-transparent"
                            : selectedDate === date
                              ? "bg-ink"
                              : "bg-mint"
                        }`}
                      />
                    </button>
                  ) : (
                    <span key={`empty-${i}`} className="aspect-square" />
                  ),
                )}
              </div>
            </div>

            {/* Chi tiết ngày */}
            <Board
              title={formatDateVi(selectedDate)}
              icon="bowl"
              aside={
                selectedSummary ? (
                  <span className="num text-sign">
                    {formatVnd(selectedSummary.cost)}
                  </span>
                ) : undefined
              }
            >
              {dayQuery.isPending ? (
                <SkeletonRows rows={3} />
              ) : logs.length > 0 ? (
                <>
                  <p className="num mb-1 text-[0.7rem] text-panel/55">
                    {selectedSummary?.protein ?? 0}g protein ·{" "}
                    {selectedSummary?.kcal ?? 0} kcal · {logs.length} bữa
                  </p>
                  {logs.map((log) => (
                    <MealRow
                      key={log.id}
                      mealType={log.mealType}
                      name={log.name}
                      detail={`P ${log.protein}g · ${log.kcal} kcal`}
                      cost={log.cost}
                    />
                  ))}
                </>
              ) : (
                <EmptyState
                  icon="calendar"
                  title="Ngày này chưa ghi nhận bữa nào"
                  hint="Vào Trang chủ bấm “Đánh dấu” sau mỗi bữa để lịch sử có dữ liệu."
                />
              )}
            </Board>
          </div>
        )}

        {tab === "stats" && (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center lg:gap-5">
              <Segmented
                className="w-full sm:w-56"
                value={range}
                onChange={setRange}
                options={[
                  ["week", "7 ngày"],
                  ["month", "30 ngày"],
                ]}
              />
              <div className="grid grid-cols-2 gap-2 lg:max-w-md lg:gap-3">
                <div className="border-2 border-panel/25 bg-enamel-deep px-3 py-2.5">
                  <p className="label text-panel/50">Đã chi</p>
                  {spending ? (
                    <p
                      className={`disp-num mt-1 text-[1.25rem] ${
                        spending.totalSpent > spending.totalBudget
                          ? "text-chili"
                          : "text-panel"
                      }`}
                    >
                      {formatVnd(spending.totalSpent)}
                    </p>
                  ) : (
                    <Skeleton className="mt-1.5 h-5 w-24" />
                  )}
                </div>
                <div className="border-2 border-panel/25 bg-enamel-deep px-3 py-2.5">
                  <p className="label text-panel/50">Ngân sách kỳ này</p>
                  {spending ? (
                    <p className="disp-num mt-1 text-[1.25rem] text-sign">
                      {formatVnd(spending.totalBudget)}
                    </p>
                  ) : (
                    <Skeleton className="mt-1.5 h-5 w-24" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              {/* Chi tiêu từng ngày so với hạn mức */}
              <Board title="Chi tiêu mỗi ngày" icon="chart">
                <div className="mb-2 flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-panel/70">
                    <span className="size-2.5 bg-sign" />
                    Trong hạn mức
                  </span>
                  <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-panel/70">
                    <span className="size-2.5 bg-chili" />
                    Vượt hạn mức
                  </span>
                </div>

                {spendingQuery.isPending ? (
                  <Skeleton className="h-52 w-full" />
                ) : spendingData.length === 0 ? (
                  <EmptyState
                    icon="chart"
                    title="Chưa có dữ liệu chi tiêu"
                    hint="Đánh dấu vài bữa đã ăn rồi quay lại đây."
                  />
                ) : (
                  <>
                    <div className="h-52 lg:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={spendingData} barCategoryGap="22%">
                          <CartesianGrid
                            stroke={C_GRID}
                            strokeDasharray="2 4"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10, fill: C_TICK }}
                            tickLine={false}
                            axisLine={{ stroke: C_GRID }}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: C_TICK }}
                            tickLine={false}
                            axisLine={false}
                            width={38}
                            // Nới trần để vạch hạn mức luôn nằm trong khung,
                            // kể cả những tuần chi ít hơn hạn mức nhiều.
                            domain={[
                              0,
                              (dataMax: number) =>
                                Math.max(dataMax, dailyBudget) * 1.12,
                            ]}
                            tickFormatter={(v: number) =>
                              `${Math.round(v / 1000)}k`
                            }
                          />
                          <Tooltip
                            cursor={{ fill: "rgba(251,244,226,0.07)" }}
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const day = payload[0].payload as
                                | ISpendDatum
                                | undefined;
                              if (!day) return null;
                              return (
                                <ChartTooltip
                                  label={`Ngày ${String(label)}`}
                                  rows={[
                                    {
                                      key: "spent",
                                      value: `Đã chi ${formatVnd(day.spent)}`,
                                    },
                                    {
                                      key: "budget",
                                      value: `Hạn mức ${formatVnd(day.budget)}`,
                                    },
                                  ]}
                                />
                              );
                            }}
                          />
                          {dailyBudget > 0 && (
                            <ReferenceLine
                              y={dailyBudget}
                              stroke={C_TICK}
                              strokeDasharray="4 4"
                              label={{
                                value: "Hạn mức",
                                position: "insideTopRight",
                                fill: C_TICK,
                                fontSize: 9,
                              }}
                            />
                          )}
                          {/* Bỏ animation dựng cột: biểu đồ vẽ xong ngay từ
                              khung hình đầu, không phụ thuộc rAF. */}
                          <Bar
                            dataKey="spent"
                            shape={renderSpendBar}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <details className="mt-2">
                      <summary className="label cursor-pointer text-panel/50 hover:text-sign">
                        Xem dạng bảng
                      </summary>
                      <div className="mt-2 overflow-x-auto">
                        <table className="num w-full text-[0.72rem]">
                          <thead>
                            <tr className="label text-panel/45">
                              <th className="py-1 text-left">Ngày</th>
                              <th className="py-1 text-right">Đã chi</th>
                              <th className="py-1 text-right">Hạn mức</th>
                            </tr>
                          </thead>
                          <tbody>
                            {spendingData.map((d) => (
                              <tr key={d.date} className="rule-soft">
                                <td className="py-1">{d.label}</td>
                                <td
                                  className={`py-1 text-right font-bold ${
                                    d.over ? "text-chili" : ""
                                  }`}
                                >
                                  {formatVnd(d.spent)}
                                </td>
                                <td className="py-1 text-right text-panel/50">
                                  {formatVnd(d.budget)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </>
                )}
              </Board>

              {/* Protein theo ngày trong tháng */}
              <Board title="Protein theo ngày" icon="target" aside="Tháng này">
                {monthQuery.isPending ? (
                  <Skeleton className="h-44 w-full" />
                ) : proteinData.length === 0 ? (
                  <EmptyState
                    icon="target"
                    title="Tháng này chưa có bữa nào được ghi"
                  />
                ) : (
                  <div className="h-44 lg:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={proteinData}>
                        <CartesianGrid
                          stroke={C_GRID}
                          strokeDasharray="2 4"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: C_TICK }}
                          tickLine={false}
                          axisLine={{ stroke: C_GRID }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: C_TICK }}
                          tickLine={false}
                          axisLine={false}
                          width={30}
                        />
                        <Tooltip
                          cursor={{ stroke: C_TICK, strokeDasharray: "3 3" }}
                          content={({ active, payload, label }) =>
                            active && payload?.length ? (
                              <ChartTooltip
                                label={`Ngày ${String(label)}`}
                                rows={[
                                  {
                                    key: "protein",
                                    value: `${Number(payload[0].value)}g protein`,
                                  },
                                ]}
                              />
                            ) : null
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="protein"
                          isAnimationActive={false}
                          stroke={C_MINT}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{
                            r: 4.5,
                            fill: C_MINT,
                            stroke: "#08383c",
                            strokeWidth: 2,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Board>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
