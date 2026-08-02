interface IProps {
  label: string;
  /** Dòng đầu là số chính; các dòng sau là số đối chiếu nên nhạt hơn. */
  rows: { key: string; value: string }[];
}

/** Hộp chú giải khi rê chuột — cùng chất liệu với thẻ nội dung: nền kem, viền đen. */
export default function ChartTooltip({ label, rows }: IProps) {
  return (
    <div className="border-2 border-ink bg-panel px-2.5 py-2 text-ink shadow-hard-sm">
      <p className="label text-ink/60">{label}</p>
      {rows.map((r, i) => (
        <p
          key={r.key}
          className={`num mt-1 text-[0.75rem] ${
            i === 0 ? "font-bold" : "font-semibold text-ink/55"
          }`}
        >
          {r.value}
        </p>
      ))}
    </div>
  );
}
