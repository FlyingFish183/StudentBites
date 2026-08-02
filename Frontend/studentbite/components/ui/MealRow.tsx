import { formatVnd } from "@/lib/format";
import { MEAL_LABELS, type MealType } from "@/lib/types";

interface IProps {
  mealType: MealType;
  name: string;
  /** Dòng phụ: macro, ghi chú… */
  detail?: string;
  cost: number;
  /** Nút bên phải (đánh dấu đã ăn, đổi món…). */
  action?: React.ReactNode;
  /** Đã ghi nhận rồi thì làm mờ đi để mắt bỏ qua. */
  muted?: boolean;
}

/** Một dòng trên bảng thực đơn: tên bữa, món, giá bên phải. */
export default function MealRow({
  mealType,
  name,
  detail,
  cost,
  action,
  muted = false,
}: IProps) {
  return (
    <div
      className={`rule-soft flex items-center gap-3 py-2.5 first:border-t-0 ${
        muted ? "opacity-55" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="label text-sign">{MEAL_LABELS[mealType]}</p>
        <p className="mt-0.5 truncate text-[0.88rem] font-semibold">{name}</p>
        {detail && (
          <p className="num mt-0.5 text-[0.68rem] text-panel/55">{detail}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="disp-num text-[0.95rem]">{formatVnd(cost)}</p>
        {action && <div className="mt-1 flex justify-end">{action}</div>}
      </div>
    </div>
  );
}
