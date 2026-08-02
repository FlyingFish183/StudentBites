"use client";

import { motion } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /** Delay for the scroll-in reveal, in seconds. */
  delay?: number;
  /** Accent color used for the hover glow + spotlight. */
  glow?: string;
}

/**
 * Frosted-glass card with an interactive pointer-tracking spotlight and glow
 * that follows the cursor on hover, plus a lift + reveal-on-scroll animation.
 */
export default function GlassCard({
  children,
  className = "",
  delay = 0,
  glow = "52, 211, 153", // emerald rgb
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    node.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      style={{ ["--glow" as string]: glow }}
      className={`group relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] p-6 backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-white/25 hover:shadow-[0_20px_60px_-15px_rgba(var(--glow),0.35)] ${className}`}
    >
      {/* Cursor spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--glow), 0.20), transparent 60%)",
        }}
      />
      {/* Top sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-90"
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
