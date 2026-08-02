"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Icon from "@/components/ui/Icon";
import { NAV_ITEMS } from "@/lib/nav";

/** Điều hướng cho mobile/tablet; từ 1024px trở lên nhường chỗ cho SideNav. */
export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] lg:hidden">
      <div className="pb-safe mx-auto w-full max-w-120 border-t-3 border-sign bg-enamel-deep md:max-w-215">
        <div className="grid grid-cols-6">
          {NAV_ITEMS.map((tab) => {
            const active =
              tab.href === "/home"
                ? pathname === "/home"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`disp flex flex-col items-center gap-1 py-2.5 text-[0.52rem] tracking-[0.06em] transition-[color,transform] duration-150 ${
                  active ? "text-sign" : "text-panel/45 hover:-translate-y-0.5 hover:text-panel/70"
                }`}
              >
                <Icon
                  name={tab.icon}
                  className="size-5.5"
                  strokeWidth={active ? 2.4 : 1.9}
                />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
