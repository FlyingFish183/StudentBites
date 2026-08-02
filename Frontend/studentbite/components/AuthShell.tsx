"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { type ReactNode } from "react";

import HeroScene from "@/components/HeroScene";
import Logo from "@/components/Logo";

interface Props {
  icon: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * Shared dark glassmorphism shell for the auth pages (login / register).
 * Renders the three.js hero backdrop, gradient blobs, a brand link back to
 * the landing page, and an animated frosted-glass card around the form.
 */
export default function AuthShell({ icon, title, subtitle, children }: Props) {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[#04120c] px-6 py-6 text-white">
      {/* Backdrop gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="absolute inset-0 z-0 opacity-60">
        <HeroScene />
      </div>

      {/* Brand */}
      <header className="relative z-20">
        <Link
          href="/landing"
          className="inline-flex items-center transition hover:opacity-80"
        >
          <Logo className="h-11 w-auto" badge priority />
        </Link>
      </header>

      {/* Card */}
      <div className="relative z-10 flex flex-1 items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-9"
        >
          {/* Top sheen */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent"
          />

          <div className="mb-7 text-center">
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.15,
                type: "spring",
                stiffness: 240,
                damping: 14,
              }}
              className="text-5xl"
            >
              {icon}
            </motion.div>
            <h1 className="mt-3 text-2xl font-bold">{title}</h1>
            <p className="mt-1.5 text-sm text-white/60">{subtitle}</p>
          </div>

          {children}
        </motion.div>
      </div>
    </main>
  );
}
