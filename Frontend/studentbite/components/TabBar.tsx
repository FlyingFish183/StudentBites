"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Icon from "@/components/ui/Icon";
import { NAV_ITEMS } from "@/lib/nav";
import { useUnreadCount } from "@/lib/hooks";

/** Điều hướng cho mobile/tablet; từ 1024px trở lên nhường chỗ cho SideNav. */
export default function TabBar() {
  const pathname = usePathname();
  const unreadCount = useUnreadCount();
  const bellActive = pathname === "/notifications";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] lg:hidden">
      <div className="pb-safe mx-auto w-full max-w-120 border-t-3 border-sign bg-enamel-deep md:max-w-215">
        <div className="grid grid-cols-7">
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
          <Link
            href="/notifications"
            aria-current={bellActive ? "page" : undefined}
            className={`disp relative flex flex-col items-center gap-1 py-2.5 text-[0.52rem] tracking-[0.06em] transition-[color,transform] duration-150 ${
              bellActive ? "text-sign" : "text-panel/45 hover:-translate-y-0.5 hover:text-panel/70"
            }`}
          >
            <div className="relative">
              <Icon
                name="bell"
                className="size-5.5"
                strokeWidth={bellActive ? 2.4 : 1.9}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-chili px-0.5 text-[0.45rem] font-bold text-enamel-deep">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            Thông báo
          </Link>
        </div>
      </div>
    </nav>
  );
}
