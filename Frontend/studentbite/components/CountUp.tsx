"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  /** Target value to animate toward. */
  value: number;
  /** Format the (in-between) numeric value into display text. */
  format?: (n: number) => string;
  /** Duration in seconds. */
  duration?: number;
  className?: string;
}

/**
 * Animated number that tweens from its previous value to the new `value`
 * whenever it changes. Uses framer-motion's `animate` for a smooth count-up.
 */
export default function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString("vi-VN"),
  duration = 1,
  className,
}: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const controls = animate(fromRef.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    fromRef.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
