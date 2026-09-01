"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/shop", label: "Skill Shop", icon: "🧩" },
  { href: "/finkits", label: "FinKit", icon: "📦" },
  { href: "/my-skills", label: "My Skills", icon: "🎒" },
  { href: "/agents", label: "My Agent", icon: "🤖" },
  { href: "/skill-builder", label: "Skill Builder", icon: "🛠️" },
];

export function SideNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r border-line bg-surface px-3 py-5 md:flex">
      <Link href="/" className="mb-5 flex items-center gap-2 px-2">
        <PuzzleMark />
        <span className="text-[17px] font-extrabold tracking-tight text-ink-900">FinSkill</span>
      </Link>
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
            active(it.href) ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-canvas hover:text-ink-900"
          }`}
        >
          <span className="text-[15px]">{it.icon}</span>
          {it.label}
        </Link>
      ))}
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
      {ITEMS.slice(0, 5).map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${
            active(it.href) ? "text-brand-700" : "text-ink-400"
          }`}
        >
          <span className="text-[16px]">{it.icon}</span>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

export function PuzzleMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M4 4h5.2a2.3 2.3 0 014.6 0H19a1 1 0 011 1v5.2a2.3 2.3 0 000 4.6V20a1 1 0 01-1 1h-5.2a2.3 2.3 0 00-4.6 0H4a1 1 0 01-1-1v-5.2a2.3 2.3 0 010-4.6V5a1 1 0 011-1z"
        fill="var(--color-brand-500)"
      />
    </svg>
  );
}
