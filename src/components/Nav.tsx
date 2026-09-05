"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/Brand";
const ITEMS = [
  { href: "/", label: "나의 20대", short: "나의 20대", icon: TimelineIcon },
  { href: "/opportunities", label: "지금의 기회", short: "지금의 기회", icon: SparkIcon },
  { href: "/ask", label: "AI에게 물어보기", short: "피오와 대화", icon: ChatIcon },
  { href: "/me", label: "내 정보", short: "내 정보", icon: UserIcon },
];
export function SideNav() {
  const path = usePathname();
  return <aside className="sidebar"><Link href="/" className="sidebar-brand"><Wordmark size={40} /><span>My 20s, Better Finance.</span></Link>
    <nav aria-label="주 메뉴"><ul>{ITEMS.map(({ href, label, icon: Icon }, i) => <li key={href} className={i === 3 ? "nav-secondary" : ""}><Link href={href} aria-current={path === href ? "page" : undefined} className="nav-link"><Icon active={path === href} />{label}</Link></li>)}</ul></nav>
    <div className="sidebar-footer"><span className="little-sprout">20s, and beyond.</span><p>지금의 선택이<br />더 나은 20대를 만들어요.</p><small>© 20FIN<br />Finance for what’s next.</small></div></aside>;
}
export function BottomNav() {
  const path = usePathname();
  return <nav className="bottom-nav" aria-label="모바일 메뉴">{ITEMS.map(({ href, short, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}><Icon active={path === href} /><span>{short}</span></Link>)}</nav>;
}
/* ---------------- 아이콘 ---------------- */

type IconProps = { active?: boolean; };
const stroke = (active?: boolean) => (active ? "var(--color-fin-green-600)" : "currentColor");

function base(active?: boolean) {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: stroke(active),
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

/** 나의 20대 — 시간축 위의 노드 */
function TimelineIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M3 12h18" />
      <circle cx="7" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="2.4" fill={active ? "var(--color-fin-green-500)" : "none"} />
      <circle cx="17" cy="12" r="1.8" />
    </svg>
  );
}

/** 지금의 기회 — sparkle */
function SparkIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3L12 3z" />
      <path d="M18 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
    </svg>
  );
}

/** AI에게 물어보기 — chat */
function ChatIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7A2.5 2.5 0 0117.5 16H9l-4 3.5V16H6.5" />
      <path d="M8.5 9.5h7M8.5 12.5h4" />
    </svg>
  );
}

function UserIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20a6.5 6.5 0 0113 0" />
    </svg>
  );
}
