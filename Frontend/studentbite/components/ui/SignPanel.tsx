export type PanelTone = "sign" | "panel" | "chili";

const TONES: Record<PanelTone, string> = {
  sign: "bg-sign text-ink",
  panel: "bg-panel text-ink",
  chili: "bg-chili-deep text-panel",
};

interface IProps {
  tone?: PanelTone;
  className?: string;
  children: React.ReactNode;
}

/**
 * Tấm biển sơn: viền đen dày, bóng đổ cứng, thêm một đường viền mảnh
 * bên trong đúng kiểu biển hiệu kẻ tay. Dùng cho thông tin quan trọng nhất
 * của màn hình — mỗi màn chỉ nên có một tấm.
 */
export default function SignPanel({
  tone = "sign",
  className = "",
  children,
}: IProps) {
  return (
    <div className={`panel ${TONES[tone]} px-4 py-4 ${className}`}>
      {children}
    </div>
  );
}
