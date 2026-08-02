import { type Variants } from "framer-motion";

/** Shared easing curve used across page/entrance animations. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Fade + rise, for section/card entrances. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Parent that reveals children one-by-one. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/** Spring pop-in, for badges / list items. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 22 },
  },
};
