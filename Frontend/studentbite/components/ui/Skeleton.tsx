interface IProps {
  className?: string;
}

/** Ô xám nhấp nháy thay cho chữ "Đang tải..." */
export default function Skeleton({ className = "h-4 w-full" }: IProps) {
  return (
    <div
      aria-hidden
      className={`sb-pulse border border-panel/10 bg-panel/12 ${className}`}
    />
  );
}

/** Khung chờ cho một dòng món ăn / một dòng dinh dưỡng. */
export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" role="status" aria-label="Đang tải">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
