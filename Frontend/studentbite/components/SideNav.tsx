"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import Logo from "@/components/Logo";
import { NAV_ITEMS, isActive } from "@/lib/nav";

/** Desktop sidebar navigation (hidden on mobile). */
export default function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 flex items-center px-2">
        <Logo className="h-10 w-auto" priority />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "text-primary-dark"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidenav-active"
                  className="absolute inset-0 -z-10 rounded-xl bg-primary-soft"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="text-xl leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <p className="px-3 text-[11px] text-muted">
        Ăn ngon · đủ chất · vừa túi tiền
      </p>
    </aside>
  );
}
