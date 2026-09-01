"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoWordmark } from "@/components/Logo";

const ITEMS = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/shop", label: "스킬샵", icon: ShopIcon },
  { href: "/my-skills", label: "나의 스킬", icon: StackIcon },
  { href: "/finkits", label: "FinKit", icon: KitIcon },
  { href: "/agents", label: "나의 에이전트", icon: BotIcon },
  { href: "/skill-builder", label: "스킬 만들기", icon: BuildIcon },
];

export function SideNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="hidden w-[212px] shrink-0 flex-col border-r border-line bg-surface px-3 py-5 md:flex">
      <Link href="/" className="mb-6 px-2">
        <LogoWordmark />
      </Link>
      <ul className="flex flex-col gap-0.5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const on = active(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition ${
                  on ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-canvas hover:text-ink-900"
                }`}
              >
                <Icon active={on} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto rounded-xl bg-canvas px-3 py-3">
        <p className="text-[11px] leading-relaxed text-ink-400">
          필요한 금융 능력을 연결하다.
          <br />
          <span className="font-semibold text-ink-500">Discover · Snap · Solve</span>
        </p>
      </div>
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface/95 backdrop-blur md:hidden">
      {ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => {
        const on = active(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${
              on ? "text-brand-700" : "text-ink-400"
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

/* ---------------- 아이콘 (시안의 선형 아이콘 스타일) ---------------- */

type IconProps = { active?: boolean };
const stroke = (active?: boolean) => (active ? "var(--color-brand-600)" : "currentColor");

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

function HomeIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </svg>
  );
}

function ShopIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M4 8h16l-1.2 11.2a1.6 1.6 0 01-1.6 1.4H6.8a1.6 1.6 0 01-1.6-1.4L4 8z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  );
}

function StackIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M12 3l8.5 4.5L12 12 3.5 7.5 12 3z" />
      <path d="M3.5 12L12 16.5 20.5 12" />
      <path d="M3.5 16.5L12 21l8.5-4.5" />
    </svg>
  );
}

function KitIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M3.5 8.5h17v11a1.5 1.5 0 01-1.5 1.5H5a1.5 1.5 0 01-1.5-1.5v-11z" />
      <path d="M3.5 8.5L6 3.5h12l2.5 5" />
      <path d="M12 3.5v17" />
    </svg>
  );
}

function BotIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 4.5V8" />
      <circle cx="12" cy="3.4" r="1.4" />
      <path d="M9 13.5h.01M15 13.5h.01" />
    </svg>
  );
}

function BuildIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M14.5 5.5a4 4 0 015.2 5.2l-8.6 8.6-3.4 1.2 1.2-3.4 5.6-11.6z" />
      <path d="M4 4l3 3M4 9h4" />
    </svg>
  );
}

export { LogoMark as PuzzleMark } from "@/components/Logo";
