import Icon, { type IconName } from "./Icon";

interface IBoardProps {
  /** Tên mục, in hoa kiểu bảng menu treo tường. */
  title: string;
  /** Chữ nhỏ bên phải: ngày, tổng, hoặc link "Chi tiết". */
  aside?: React.ReactNode;
  icon?: IconName;
  className?: string;
  children: React.ReactNode;
}

/**
 * Một mục nội dung trên nền men xanh: tiêu đề vàng, kẻ ngang chạy hết
 * chỗ trống rồi tới chữ phụ bên phải — đúng nhịp một tấm bảng thực đơn.
 *
 * Không tự chừa lề ngang: lề do khung trang quyết định, nhờ vậy Board đặt
 * thẳng vào ô của lưới desktop mà không bị thụt hai lần.
 */
export default function Board({
  title,
  aside,
  icon,
  className = "",
  children,
}: IBoardProps) {
  return (
    <section className={`anim-rise-sm ${className}`}>
      <div className="mb-2 flex items-center gap-2.5">
        {icon && <Icon name={icon} className="size-4 shrink-0 text-sign" />}
        <h2 className="disp shrink-0 text-[0.95rem] tracking-widest text-sign">
          {title}
        </h2>
        <div className="rule-grow h-0.5 flex-1 bg-panel/20" />
        {aside && <div className="label shrink-0 text-panel/60">{aside}</div>}
      </div>
      {children}
    </section>
  );
}
