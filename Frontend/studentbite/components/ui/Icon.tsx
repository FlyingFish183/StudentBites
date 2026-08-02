/**
 * Bộ icon vẽ nét, thay toàn bộ emoji của bản trước.
 * Nét dày mặc định 2px để đứng được cạnh chữ Anton và viền panel.
 */

export type IconName =
  | "home"
  | "bowl"
  | "calendar"
  | "cart"
  | "gear"
  | "logout"
  | "swap"
  | "check"
  | "plus"
  | "chevronLeft"
  | "chevronRight"
  | "arrowRight"
  | "search"
  | "pin"
  | "alert"
  | "spinner"
  | "dice"
  | "target"
  | "ruler"
  | "wallet"
  | "navigate"
  | "close"
  | "trash"
  | "chart"
  | "user"
  | "chat"
  | "send"
  | "streak";

const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-6v6H4.5a1 1 0 0 1-1-1z" />,
  bowl: (
    <>
      <path d="M3 11h18a9 9 0 0 1-18 0z" />
      <path d="M2 21h20M9 7c0-1.5 3-1.5 3-3M14 7.5c0-1 2-1.2 2-2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17.5h2" />
    </>
  ),
  cart: (
    <>
      <path d="M2.5 3.5h2l2.4 11.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.5l1.6-6.3H6" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  logout: <path d="M15 4h3.5a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 8l-4 4 4 4M6 12h11" />,
  swap: <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />,
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevronLeft: <path d="M15 5l-7 7 7 7" />,
  chevronRight: <path d="M9 5l7 7-7 7" />,
  arrowRight: <path d="M4 12h15M13 6l6 6-6 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 22 20H2z" />
      <path d="M12 9.5v4.5M12 17h.01" />
    </>
  ),
  spinner: <path d="M12 3a9 9 0 1 0 9 9" />,
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" strokeWidth="2.4" />
    </>
  ),
  ruler: (
    <>
      <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
      <path d="M7 8v3M11 8v4.5M15 8v3M19 8v4.5" />
    </>
  ),
  wallet: (
    <>
      <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h11a2 2 0 0 1 2 2v1" />
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M16 13.5h.01" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  navigate: <path d="M21 3 3 10.5l7.5 3L13.5 21z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  trash: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10.5 11v5M13.5 11v5" />,
  chart: <path d="M4 20V4M4 20h16M8 20v-6M12.5 20V9M17 20v-9" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20.5c1.1-3.7 3.8-5.6 7.2-5.6s6.1 1.9 7.2 5.6" />
    </>
  ),
  chat: (
    <>
      <path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4.5 3v-3H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
      <path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  send: <path d="M4 12h13M12 6l6 6-6 6" />,
  streak: (
    <>
      <path d="M12 21c4.2-1.2 7-4.4 7-8.2 0-3.5-2-5.8-4.2-7.3-.4 2.2-1.8 3.4-3.3 3.8C11 5.8 10.2 3 10.2 3 7.4 5.6 5 9 5 12.8 5 16.6 7.8 19.8 12 21z" />
    </>
  ),
};

interface IProps {
  name: IconName;
  className?: string;
  strokeWidth?: number;
  /** Icon trang trí thì để mặc định; icon mang nghĩa thì truyền title. */
  title?: string;
}

export default function Icon({
  name,
  className = "size-5",
  strokeWidth = 2,
  title,
}: IProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} ${name === "spinner" ? "animate-spin" : ""}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {PATHS[name]}
    </svg>
  );
}
