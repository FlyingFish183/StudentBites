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
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`disp flex flex-col items-center gap-1 py-2.5 text-[0.58rem] tracking-[0.08em] transition-colors ${
                  active ? "text-sign" : "text-panel/45"
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
