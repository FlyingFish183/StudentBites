import type { IconName } from "@/components/ui/Icon";

export interface INavItem {
  href: string;
  label: string;
  icon: IconName;
}

/** Mục điều hướng chính; TabBar (mobile) và SideNav (desktop) dùng chung. */
export const NAV_ITEMS: readonly INavItem[] = [
  { href: "/home", label: "Trang chủ", icon: "home" },
  { href: "/planner", label: "Thực đơn", icon: "bowl" },
  { href: "/tracking", label: "Theo dõi", icon: "streak" },
  { href: "/prices", label: "So giá", icon: "search" },
  { href: "/history", label: "Lịch sử", icon: "calendar" },
  { href: "/stores", label: "Đi chợ", icon: "cart" },
];
