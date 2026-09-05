"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/Brand";

/** 20FIN Primary Navigation (docs/design-spec.md §6) */
const ITEMS = [
  { href: "/", label: "나의 20대", icon: TimelineIcon },
  { href: "/opportunities", label: "지금의 기회", icon: SparkIcon },
  { href: "/ask", label: "AI에게 물어보기", icon: ChatIcon },
];

const SUB = [
  { href: "/me", label: "내 정보", icon: UserIcon },
];

export function SideNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="hidden w-[212px] shrink-0 flex-col border-r border-line bg-surface px-3 py-5 md:flex">
      <Link href="/" className="mb-6 px-2">
        <Wordmark />
      </Link>
      <ul className="flex flex-col gap-0.5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const on = active(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition ${
                  on
                    ? "bg-fin-green-50 text-fin-green-700"
                    : "text-ink-500 hover:bg-canvas hover:text-ink-900"
                }`}
              >
                <Icon active={on} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="my-3 border-t border-line" />
      <ul className="flex flex-col gap-0.5">
        {SUB.map(({ href, label, icon: Icon }) => {
          const on = active(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  on ? "bg-fin-green-50 text-fin-green-700" : "text-ink-400 hover:bg-canvas hover:text-ink-700"
                }`}
              >
                <Icon active={on} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto rounded-xl bg-fin-cream px-3 py-3">
        <p className="text-[11px] leading-relaxed text-ink-500">
          20대의 다음을 준비하는 금융.
          <br />
          <span className="font-semibold text-fin-green-700">My 20s, Better Finance.</span>
        </p>
      </div>
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const items = [...ITEMS, ...SUB];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface/95 backdrop-blur md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const on = active(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${
              on ? "text-fin-green-700" : "text-ink-400"
            }`}
          >
            <Icon active={on} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ---------------- 아이콘 ---------------- */

type IconProps = { active?: boolean };
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
