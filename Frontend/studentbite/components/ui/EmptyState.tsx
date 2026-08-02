import Icon, { type IconName } from "./Icon";

interface IProps {
  icon: IconName;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}

/** Trạng thái rỗng: nói rõ đang thiếu gì và làm gì tiếp theo. */
export default function EmptyState({ icon, title, hint, action }: IProps) {
  return (
    <div className="anim-rise-sm border-2 border-dashed border-panel/25 px-5 py-8 text-center">
      <Icon
        name={icon}
        className="mx-auto size-9 text-panel/35 transition-transform duration-300 hover:scale-110"
        strokeWidth={1.6}
      />
      <p className="disp mt-3 text-[0.95rem] text-panel/85">{title}</p>
      {hint && (
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[0.75rem] leading-relaxed text-panel/55">
          {hint}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
