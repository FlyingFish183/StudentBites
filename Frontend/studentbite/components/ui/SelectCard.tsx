import Icon from "./Icon";

interface IProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
  /** Chọn theo hàng ngang (giới tính) thì bỏ dấu tích cho gọn. */
  compact?: boolean;
}

/** Ô lựa chọn trong wizard: được chọn thì sơn vàng đúng kiểu tích vào phiếu. */
export default function SelectCard({
  selected,
  onClick,
  title,
  hint,
  compact = false,
}: IProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 border-2 text-left transition-colors ${
        compact ? "justify-center px-3 py-3" : "px-3.5 py-3"
      } ${
        selected
          ? "border-ink bg-sign text-ink shadow-hard-deep"
          : "border-panel/30 bg-transparent text-panel/75 hover:border-panel/55"
      }`}
    >
      {!compact && (
        <span
          className={`flex size-5 shrink-0 items-center justify-center border-2 ${
            selected ? "border-ink bg-ink text-sign" : "border-panel/40"
          }`}
        >
          {selected && <Icon name="check" className="size-3" strokeWidth={3.5} />}
        </span>
      )}
      <span className="min-w-0">
        <span
          className={`block text-[0.85rem] font-bold ${compact ? "text-center" : ""}`}
        >
          {title}
        </span>
        {hint && (
          <span
            className={`mt-0.5 block text-[0.7rem] ${
              selected ? "text-ink/65" : "text-panel/50"
            }`}
          >
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}
