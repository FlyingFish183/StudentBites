"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** When true, apply the pulsing amber glow. */
  active?: boolean;
  className?: string;
}

/**
 * Wraps content with a subtle pulsing amber glow (CSS keyframe) — used to draw
 * attention to a protein goal that is falling behind near end-of-day.
 */
export default function GlowAlert({
  children,
  active = false,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl ${active ? "animate-[glow_1.8s_ease-in-out_infinite]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
