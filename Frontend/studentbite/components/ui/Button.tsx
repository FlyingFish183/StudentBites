import Icon, { type IconName } from "./Icon";

export type ButtonVariant = "primary" | "danger" | "dark" | "ghost";
export type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-sign text-ink border-ink shadow-hard-deep",
  danger: "bg-chili-deep text-panel border-ink shadow-hard-deep",
  dark: "bg-ink text-sign border-ink shadow-hard-deep",
  ghost: "bg-transparent text-panel border-panel/35 shadow-none",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[0.62rem] tracking-[0.12em] border-2",
  md: "px-4 py-3 text-[0.78rem] tracking-widest border-2",
};

/**
 * Không dùng được thì bỏ hẳn lớp sơn thay vì làm mờ nó — vàng mờ trên nền men
 * ra một màu olive trông như lỗi hiển thị.
 */
const INERT = "bg-transparent border-panel/20 text-panel/30 shadow-none cursor-not-allowed";

const BASE = "disp press inline-flex items-center justify-center gap-1.5";

/** Class dùng chung cho <button> và <Link> để hai thứ luôn trông giống nhau. */
export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = "",
): string {
  return [BASE, VARIANTS[variant], SIZES[size], extra].join(" ");
}

interface IProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  full?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  full = false,
  className = "",
  children,
  disabled = false,
  ...rest
}: IProps) {
  // Đang chạy thì vẫn giữ nguyên lớp sơn, chỉ đổi con trỏ và làm dịu đi.
  const inert = disabled && !loading;
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        BASE,
        SIZES[size],
        inert ? INERT : VARIANTS[variant],
        loading ? "cursor-wait opacity-75" : "",
        full ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {loading ? (
        <Icon name="spinner" className={size === "sm" ? "size-3.5" : "size-4"} />
      ) : icon ? (
        <Icon name={icon} className={size === "sm" ? "size-3.5" : "size-4"} />
      ) : null}
      {children}
    </button>
  );
}
