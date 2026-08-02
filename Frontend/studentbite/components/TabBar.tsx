"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { NAV_ITEMS, isActive } from "@/lib/nav";

/** Mobile bottom navigation (hidden on desktop, where SideNav takes over). */
export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] lg:hidden">
      <div className="pb-safe mx-auto w-full max-w-[560px] border-t border-border bg-surface/95 backdrop-blur">
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-primary-dark" : "text-muted"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tabbar-active"
                    className="absolute -top-px h-0.5 w-8 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 34 }}
                  />
                )}
                <motion.span
                  className="text-xl leading-none"
                  animate={{ scale: active ? 1.12 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  {tab.icon}
                </motion.span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
