export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

/** Primary navigation shared by the mobile tab bar and desktop sidebar. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/planner", label: "Thực đơn", icon: "🍱" },
  { href: "/history", label: "Lịch sử", icon: "📅" },
  { href: "/stores", label: "Mua sắm", icon: "🛒" },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
