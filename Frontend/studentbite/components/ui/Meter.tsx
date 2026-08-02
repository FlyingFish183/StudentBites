export type MeterTone = "protein" | "carb" | "fat" | "kcal";

const FILL: Record<MeterTone, string> = {
  protein: "bg-chili",
  carb: "bg-sign",
  fat: "bg-mango",
  kcal: "bg-mint",
};

interface IProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  tone: MeterTone;
}

/**
 * Một dòng dinh dưỡng: nhãn trái, thanh sơn ở giữa, số phải.
 * Vượt mục tiêu thì thanh chuyển sang gạch chéo cảnh báo thay vì đổi màu —
 * màu đã mang nghĩa "đây là chỉ số nào" nên không dùng lại để báo trạng thái.
 */
export default function Meter({
  label,
  value,
  target,
  unit = "",
  tone,
}: IProps) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const over = target > 0 && value > target;
  return (
    <div className="grid grid-cols-[3.4rem_1fr_auto] items-center gap-2.5 py-1.5">
      <span className="label text-panel/55">{label}</span>
      <div
        className="h-2.5 border border-panel/20 bg-enamel-deep"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(target)}
      >
        <div
          className={`h-full transition-[width] duration-500 ${FILL[tone]}`}
          style={{
            width: `${pct}%`,
            backgroundImage: over
              ? "repeating-linear-gradient(45deg, rgba(6,40,43,.55) 0 3px, transparent 3px 7px)"
              : undefined,
          }}
        />
      </div>
      <span className="num text-[0.72rem] font-extrabold">
        {Math.round(value).toLocaleString("vi-VN")}
        <span className="font-semibold opacity-50">
          /{Math.round(target).toLocaleString("vi-VN")}
          {unit}
        </span>
      </span>
    </div>
  );
}
