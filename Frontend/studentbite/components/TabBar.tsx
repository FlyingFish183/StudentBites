"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/planner", label: "Thực đơn", icon: "🍱" },
  { href: "/history", label: "Lịch sử", icon: "📅" },
  { href: "/stores", label: "Mua sắm", icon: "🛒" },
] as const;

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000]">
      <div className="pb-safe mx-auto w-full max-w-[480px] border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="grid grid-cols-4">
          {TABS.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-green-600" : "text-gray-400"
                }`}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
