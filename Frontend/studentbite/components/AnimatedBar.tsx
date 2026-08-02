"use client";

import { motion } from "framer-motion";

interface Props {
  label: string;
  value: number;
  target: number;
  unit?: string;
  /** CSS color for the fill. */
  color?: string;
}

/**
 * Horizontal macro indicator whose fill animates from 0% to the target ratio
 * on mount. Turns amber when the value exceeds the target.
 */
export default function AnimatedBar({
  label,
  value,
  target,
  unit = "",
  color = "var(--primary)",
}: Props) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const over = target > 0 && value > target;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground/80">{label}</span>
        <span
          className={
            over ? "font-semibold text-secondary" : "text-muted"
          }
        >
          {Math.round(value).toLocaleString("vi-VN")}/
          {Math.round(target).toLocaleString("vi-VN")}
          {unit}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: over ? "var(--secondary)" : color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
