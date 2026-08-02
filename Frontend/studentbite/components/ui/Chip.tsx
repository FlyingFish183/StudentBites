interface IProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Nút chọn nhanh (ngày, khoảng thời gian, bán kính). */
export default function Chip({
  active = false,
  className = "",
  children,
  ...rest
}: IProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...rest}
      className={`disp shrink-0 border-2 px-3 py-2 text-[0.62rem] tracking-[0.08em] transition-colors ${
        active
          ? "border-sign bg-sign text-ink"
          : "border-panel/30 bg-transparent text-panel/65 hover:border-panel/55 hover:text-panel"
      } ${className}`}
    >
      {children}
    </button>
  );
}
