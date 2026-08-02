interface IProps {
  /** Chữ nhỏ phía trên tiêu đề. */
  eyebrow?: React.ReactNode;
  title: string;
  /** Chữ phụ căn phải: ngày, số lượng… */
  aside?: React.ReactNode;
  /** Nút ở góc phải; trên desktop thường để trống vì đã có ở thanh bên. */
  actions?: React.ReactNode;
}

/**
 * Đầu trang dùng chung. Trên mobile là một dải sơn đậm sát mép;
 * trên desktop nó nhả nền, to lên và có kẻ chân như tiêu đề mục trên bảng.
 */
export default function PageHeader({
  eyebrow,
  title,
  aside,
  actions,
}: IProps) {
  return (
    <header className="flex items-center justify-between gap-3 bg-enamel-deep px-4 py-3 lg:mb-2 lg:border-b-2 lg:border-panel/12 lg:bg-transparent lg:px-6 lg:pt-9 lg:pb-5">
      <div className="min-w-0">
        {eyebrow && (
          <p className="label truncate text-panel/50 lg:mb-1.5">{eyebrow}</p>
        )}
        <h1 className="disp truncate text-[1.05rem] tracking-[0.12em] text-sign lg:text-[1.9rem] lg:tracking-[0.08em]">
          {title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {aside && (
          <p className="text-[0.72rem] text-panel/60 lg:text-[0.85rem]">
            {aside}
          </p>
        )}
        {actions}
      </div>
    </header>
  );
}
