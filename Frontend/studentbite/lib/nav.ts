import type { IconName } from "@/components/ui/Icon";

export interface INavItem {
  href: string;
  label: string;
  icon: IconName;
}

/** Bốn mục điều hướng chính; TabBar (mobile) và SideNav (desktop) dùng chung. */
export const NAV_ITEMS: readonly INavItem[] = [
  { href: "/", label: "Trang chủ", icon: "home" },
  { href: "/planner", label: "Thực đơn", icon: "bowl" },
  { href: "/history", label: "Lịch sử", icon: "calendar" },
  { href: "/stores", label: "Đi chợ", icon: "cart" },
];
