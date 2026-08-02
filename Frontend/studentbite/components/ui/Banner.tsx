import Icon, { type IconName } from "./Icon";

export type BannerTone = "critical" | "warn" | "good";

const TONES: Record<BannerTone, { box: string; icon: IconName }> = {
  critical: { box: "bg-chili-deep text-panel border-ink", icon: "alert" },
  warn: { box: "bg-mango text-ink border-ink", icon: "alert" },
  good: { box: "bg-mint text-ink border-ink", icon: "check" },
};

interface IProps {
  tone?: BannerTone;
  className?: string;
  children: React.ReactNode;
}

/** Dải thông báo kiểu băng-rôn dán ngang bảng hiệu. */
export default function Banner({
  tone = "critical",
  className = "",
  children,
}: IProps) {
  const { box, icon } = TONES[tone];
  return (
    <div
      role={tone === "good" ? "status" : "alert"}
      className={`flex items-start gap-2 border-2 px-3 py-2.5 text-[0.72rem] leading-snug font-semibold ${box} ${className}`}
    >
      <Icon name={icon} className="mt-0.5 size-4 shrink-0" strokeWidth={2.4} />
      <span>{children}</span>
    </div>
  );
}
