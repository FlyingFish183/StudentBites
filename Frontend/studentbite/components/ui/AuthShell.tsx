interface IProps {
  /** Tiêu đề của form, hiện ở cột phải. */
  title: string;
  eyebrow?: string;
  intro?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Khung cho các màn chưa đăng nhập.
 * Điện thoại: một cột, tấm biển nằm trên form.
 * Desktop: tấm biển chiếm nửa trái như biển hiệu treo trước quán,
 * form nằm nửa phải.
 */
export default function AuthShell({
  title,
  eyebrow,
  intro,
  children,
  footer,
}: IProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* Nửa biển hiệu */}
      <div className="flex items-center justify-center bg-enamel-deep px-5 py-10 lg:min-h-dvh lg:px-12">
        <div className="w-full max-w-md">
          <div className="panel bg-sign px-5 py-6 text-center text-ink lg:px-8 lg:py-10">
            <p className="disp text-[2rem] leading-none lg:text-[3.2rem]">
              StudentBites
            </p>
            <div className="mx-auto my-3 h-0.5 w-16 bg-ink lg:w-24" />
            <p className="text-[0.72rem] font-bold tracking-wide lg:text-[0.9rem]">
              Ăn đủ chất · Vừa túi tiền sinh viên
            </p>
          </div>
          <ul className="mt-6 hidden space-y-2 text-[0.85rem] text-panel/65 lg:block">
            <li>Thực đơn tự lên, đủ đạm mà không vượt hạn mức ngày.</li>
            <li>Ghi lại từng bữa, biết tháng này còn tiêu được bao nhiêu.</li>
            <li>So giá nguyên liệu giữa các chợ và siêu thị quanh bạn.</li>
          </ul>
        </div>
      </div>

      {/* Nửa form */}
      <div className="flex items-center justify-center px-5 pb-12 lg:min-h-dvh lg:px-12 lg:py-10">
        <div className="w-full max-w-md">
          {eyebrow && <p className="label text-sign">{eyebrow}</p>}
          <h1 className="disp mt-1.5 text-[1.9rem] leading-none lg:text-[2.4rem]">
            {title}
          </h1>
          {intro && (
            <p className="mt-2 text-[0.8rem] text-panel/60">{intro}</p>
          )}
          <div className="mt-6">{children}</div>
          {footer && (
            <div className="mt-7 text-center text-[0.8rem] text-panel/60">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
