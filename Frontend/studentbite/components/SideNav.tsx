"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Icon from "@/components/ui/Icon";
import { NAV_ITEMS } from "@/lib/nav";
import { useLogout, useMe } from "@/lib/hooks";

/**
 * Thanh bên desktop — bảng hiệu dựng đứng treo cạnh quán.
 * Dưới 1024px thanh này ẩn đi, điều hướng chuyển xuống TabBar.
 */
export default function SideNav() {
  const pathname = usePathname();
  const { data: user } = useMe();
  const logout = useLogout();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r-3 border-sign bg-enamel-deep lg:flex xl:w-64">
      <div className="border-b-2 border-panel/12 px-5 py-6">
        <p className="disp text-[1.35rem] leading-none tracking-[0.1em] text-sign">
          StudentBites
        </p>
        <p className="mt-2 text-[0.68rem] leading-snug text-panel/50">
          Ăn đủ chất, vừa túi tiền
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/home"
              ? pathname === "/home"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`disp flex items-center gap-3 border-2 px-3 py-2.5 text-[0.72rem] tracking-[0.12em] transition-[transform,color,box-shadow,border-color,background-color] duration-150 ${
                active
                  ? "border-ink bg-sign text-ink shadow-hard-sm"
                  : "border-transparent text-panel/60 hover:translate-x-0.5 hover:border-panel/25 hover:text-panel"
              }`}
            >
              <Icon
                name={item.icon}
                className="size-[18px] shrink-0"
                strokeWidth={active ? 2.4 : 1.9}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t-2 border-panel/12 px-3 py-4">
        <p className="label px-1 text-panel/40">Tài khoản</p>
        <p className="mt-1 truncate px-1 text-[0.85rem] font-bold">
          {user?.name}
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            href="/onboarding"
            className="disp press flex flex-1 items-center justify-center gap-1.5 border-2 border-panel/30 py-2 text-[0.58rem] tracking-[0.12em] text-panel/70 hover:border-sign hover:text-sign"
          >
            <Icon name="user" className="size-3.5" />
            Hồ sơ
          </Link>
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="disp press flex items-center justify-center gap-1.5 border-2 border-panel/30 px-3 py-2 text-[0.58rem] tracking-[0.12em] text-panel/70 hover:border-chili hover:text-chili"
          >
            <Icon
              name={logout.isPending ? "spinner" : "logout"}
              className="size-3.5"
              title="Đăng xuất"
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
