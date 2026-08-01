"use client";

interface IProps {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string; // class tailwind, vd "bg-green-500"
}

/** Progress bar dinh dưỡng: hiện giá trị / mục tiêu + % */
export default function ProgressBar(props: IProps) {
  const { label, value, target, unit, color } = props;
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const over = target > 0 && value > target;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={over ? "font-semibold text-orange-500" : "text-gray-500"}>
          {value.toLocaleString("vi-VN")}/{target.toLocaleString("vi-VN")}
          {unit}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? "bg-orange-400" : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
