import { useId } from "react";

interface IProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  suffix?: string;
}

/**
 * Ô nhập kiểu phiếu điền tay: nền kem, viền đen dày, không bo góc.
 * Nhãn nằm ngoài ô để không bị dấu tiếng Việt che khi focus.
 */
export default function Field({
  label,
  hint,
  suffix,
  className = "",
  ...rest
}: IProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label mb-1.5 block text-panel/70">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          {...rest}
          className={`w-full border-2 border-ink bg-panel px-3 py-3 text-base font-semibold text-ink placeholder:font-normal placeholder:text-ink/35 focus:outline-none focus-visible:border-sign-deep ${
            suffix ? "pr-12" : ""
          }`}
        />
        {suffix && (
          <span className="label pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink/45">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-[0.7rem] text-panel/50">{hint}</p>}
    </div>
  );
}
