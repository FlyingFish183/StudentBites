interface IProps<T extends string> {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Công tắc gạt giữa vài chế độ xem — viền chung, ô đang chọn được sơn vàng. */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: IProps<T>) {
  return (
    <div
      role="tablist"
      className={`grid border-2 border-ink bg-enamel-deep ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map(([key, label]) => {
        const active = key === value;
        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={`disp py-2.5 text-[0.68rem] tracking-widest transition-colors ${
              active ? "bg-sign text-ink" : "text-panel/55 hover:text-panel"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
