/**
 * 20FIN 아이콘 세트.
 *
 * 이모지 대신 쓰는 선형 SVG 아이콘. 사이드바 메뉴 아이콘과 같은 규격
 * (24 viewBox · stroke 1.8 · round cap/join · currentColor)으로 통일해
 * 화면 전체 톤이 어긋나지 않게 한다.
 *
 * Skill 데이터의 `icon` 필드는 이 이름 중 하나를 가리킨다.
 */

export type IconName =
  // 주거
  | "building"
  | "home"
  | "signal"
  // 교육·정책
  | "graduation"
  | "megaphone"
  | "book"
  // 계산·분석
  | "calculator"
  | "chart"
  | "scale"
  | "target"
  | "receipt"
  | "trending"
  | "bank"
  // 보호
  | "shield"
  // 사람·묶음
  | "briefcase"
  | "sprout"
  | "kit"
  | "puzzle"
  | "bot"
  // UI
  | "chat"
  | "search"
  | "flask"
  | "check"
  | "plus"
  | "settings"
  | "card"
  | "pie";

const PATHS: Record<IconName, React.ReactNode> = {
  building: (
    <>
      <path d="M4 21V6a1 1 0 011-1h7a1 1 0 011 1v15" />
      <path d="M13 10h6a1 1 0 011 1v10" />
      <path d="M7 9h3M7 13h3M7 17h3M16 14h1M16 18h1" />
      <path d="M2.5 21h19" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </>
  ),
  signal: (
    <>
      <path d="M5 12a7 7 0 0114 0" />
      <path d="M8.5 15a3.5 3.5 0 017 0" />
      <circle cx="12" cy="19" r="1.4" />
    </>
  ),
  graduation: (
    <>
      <path d="M12 4l9 4.5-9 4.5-9-4.5L12 4z" />
      <path d="M7 11v5c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6v-5" />
      <path d="M21 8.5V14" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10.5v3a1.5 1.5 0 001.5 1.5H7l7 4.5V6L7 10.5H5.5A1.5 1.5 0 004 12z" />
      <path d="M17.5 9.5a4 4 0 010 5" />
      <path d="M7 15v4.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A1.5 1.5 0 015.5 4H19v14H5.5A1.5 1.5 0 004 19.5z" />
      <path d="M4 19.5A1.5 1.5 0 015.5 18H19v2.5H5.5A1.5 1.5 0 014 19.5z" />
      <path d="M8 8h7M8 11.5h5" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8.5 7h7" />
      <path d="M9 11.5h.01M12 11.5h.01M15 11.5h.01M9 15h.01M12 15h.01M15 15h.01M9 18h.01M12 18h.01M15 18h.01" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-6M12 20V7M17 20v-9" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M7 20h10" />
      <path d="M5 8h14M8.5 7.5L5.5 14h6z" />
      <path d="M15.5 7.5L12.5 14h6z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-1.4z" />
      <path d="M9.5 8h5M9.5 12h5" />
    </>
  ),
  trending: (
    <>
      <path d="M4 16l5-5 3.5 3.5L20 7" />
      <path d="M15 7h5v5" />
    </>
  ),
  bank: (
    <>
      <path d="M3 9.5L12 4l9 5.5" />
      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
      <path d="M3 21h18" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.5 3v6c0 4.4-3.1 8-7.5 9.3C7.6 20 4.5 16.4 4.5 12V6z" />
      <path d="M9 12.2l2.2 2.2L15.5 10" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
      <path d="M9 7.5V6a2 2 0 012-2h2a2 2 0 012 2v1.5" />
      <path d="M3 13h18" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-7" />
      <path d="M12 14c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6z" />
      <path d="M12 14c0-3.9 3.1-7 7-7 0 3.9-3.1 7-7 7z" />
    </>
  ),
  kit: (
    <>
      <path d="M3.5 8.5h17v11a1.5 1.5 0 01-1.5 1.5H5a1.5 1.5 0 01-1.5-1.5z" />
      <path d="M3.5 8.5L6 3.5h12l2.5 5" />
      <path d="M12 3.5v17" />
    </>
  ),
  puzzle: (
    <>
      <path d="M10.5 4.5a2 2 0 014 0V6h3.5a1 1 0 011 1v3.5h1.5a2 2 0 010 4H19V19a1 1 0 01-1 1h-3.5v-1.5a2 2 0 00-4 0V20H7a1 1 0 01-1-1v-3.5H4.5a2 2 0 010-4H6V7a1 1 0 011-1h3.5z" />
    </>
  ),
  bot: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 4.5V8" />
      <circle cx="12" cy="3.4" r="1.4" />
      <path d="M9 13.5h.01M15 13.5h.01" />
    </>
  ),
  chat: (
    <>
      <path d="M20 12a7.5 7.5 0 01-10.9 6.7L4 20l1.3-4.4A7.5 7.5 0 1120 12z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3v6L4.8 17.4A2 2 0 006.5 20.5h11a2 2 0 001.7-3.1L14.5 9V3" />
      <path d="M8.5 3h7M7.5 14h9" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18M6.5 14.5h3" />
    </>
  ),
  pie: (
    <>
      <path d="M12 3a9 9 0 109 9h-9z" />
      <path d="M14.5 2.5A7.5 7.5 0 0121.5 9.5h-7z" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className = "",
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name] ?? PATHS.puzzle}
    </svg>
  );
}

/** 사용자가 Custom Skill 을 만들 때 고를 수 있는 아이콘 */
export const PICKABLE_ICONS: IconName[] = [
  "puzzle",
  "calculator",
  "chart",
  "target",
  "bank",
  "book",
  "shield",
  "home",
  "graduation",
  "briefcase",
  "receipt",
  "trending",
  "scale",
  "pie",
];

export function isIconName(v: string): v is IconName {
  return v in PATHS;
}
