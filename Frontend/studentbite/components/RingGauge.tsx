"use client";

import { motion } from "framer-motion";

interface Props {
  value: number;
  target: number;
  label: string;
  unit?: string;
  /** CSS color for the progress stroke. */
  color?: string;
  size?: number;
  stroke?: number;
}

/**
 * Circular progress gauge with an animated SVG stroke-dashoffset that
 * smooth-fills from 0% to the target ratio on mount.
 */
export default function RingGauge({
  value,
  target,
  label,
  unit = "",
  color = "var(--primary)",
  size = 116,
  stroke = 11,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = target > 0 ? Math.min(value / target, 1) : 0;
  const over = target > 0 && value > target;
  const pct = Math.round((target > 0 ? value / target : 0) * 100);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "var(--secondary)" : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - c * ratio }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none text-foreground">
          {Math.round(value).toLocaleString("vi-VN")}
          <span className="text-[11px] font-medium text-muted">{unit}</span>
        </span>
        <span className="mt-0.5 text-[11px] font-medium text-muted">
          {label}
        </span>
        <span
          className={`mt-0.5 text-[10px] font-semibold ${
            over ? "text-secondary" : "text-primary"
          }`}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}
