import Link from "next/link";
import type { ReactNode } from "react";
import type { Axis, Category, RiskLevel, SkillType } from "@/lib/types";
import { CATEGORY_LABEL, TYPE_LABEL } from "@/lib/data/personas";

export function Card({
  children,
  className = "",
  as: As = "div",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  hover?: boolean;
}) {
  return (
    <As className={`card-soft ${hover ? "card-soft-hover" : ""} ${className}`}>{children}</As>
  );
}

/**
 * Skill 아이콘 타일 — 시안의 파스텔 배경 + 이모지 조합.
 * Skill 의 첫 Category 로 색을 정해 같은 분야끼리 시각적으로 묶인다.
 */
const TILE_TONE: Record<string, string> = {
  housing: "bg-brand-50",
  youth: "bg-accent-50",
  education: "bg-accent-50",
  saving: "bg-brand-50",
  wealth: "bg-brand-50",
  spending: "bg-[#fdf4e5]",
  credit: "bg-[#f0eefe]",
  security: "bg-[#fdedf0]",
  literacy: "bg-[#fdf4e5]",
  invest: "bg-[#f0eefe]",
};

export function IconTile({
  icon,
  category,
  size = 44,
}: {
  icon: string;
  category?: string;
  size?: number;
}) {
  const tone = (category && TILE_TONE[category]) || "bg-brand-50";
  return (
    <span
      className={`icon-tile ${tone}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.46) }}
    >
      {icon}
    </span>
  );
}

/** 별점 — 시안의 ★ 4.9 (238) 형태 */
export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-ink-500">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-star)" aria-hidden>
        <path d="M12 2.5l2.9 6.05 6.6.86-4.85 4.55 1.23 6.54L12 17.4l-5.88 3.1 1.23-6.54L2.5 9.41l6.6-.86L12 2.5z" />
      </svg>
      {value.toFixed(1)}
      {count !== undefined && <span className="font-normal text-ink-400">({count.toLocaleString("ko-KR")})</span>}
    </span>
  );
}

/** 시안의 "무료" 배지 */
export function FreeBadge() {
  return (
    <span className="rounded-md bg-accent-50 px-1.5 py-0.5 text-[11px] font-bold text-accent-600">무료</span>
  );
}

/** 시안의 #해시태그 칩 */
export function HashChip({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-500">#{label}</span>
  );
}

export function SectionHeader({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[17px] font-bold tracking-tight text-ink-900">{title}</h2>
        {desc && <p className="mt-1 text-[13px] text-ink-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

const RISK_STYLE: Record<RiskLevel, { bg: string; fg: string; label: string }> = {
  low: { bg: "bg-risk-low-bg", fg: "text-risk-low", label: "위험도 LOW" },
  medium: { bg: "bg-risk-medium-bg", fg: "text-risk-medium", label: "위험도 MEDIUM" },
  high: { bg: "bg-risk-high-bg", fg: "text-risk-high", label: "위험도 HIGH" },
};

export function RiskBadge({ level, compact = false }: { level: RiskLevel; compact?: boolean }) {
  const s = RISK_STYLE[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.bg} ${s.fg}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {compact ? level.toUpperCase() : s.label}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-400">
        미검증
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
      <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current" aria-hidden>
        <path d="M8 0.8l1.9 1.5 2.4-.2.6 2.3 2 1.4-1.1 2.2 1.1 2.2-2 1.4-.6 2.3-2.4-.2L8 15.2l-1.9-1.5-2.4.2-.6-2.3-2-1.4L2.2 8 1.1 5.8l2-1.4.6-2.3 2.4.2L8 .8zm-.8 9.9l4-4-1.1-1.1-2.9 2.9-1.3-1.3-1.1 1.1 2.4 2.4z" />
      </svg>
      Verified
    </span>
  );
}

export function CategoryChip({ c }: { c: Category }) {
  return (
    <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700">
      {CATEGORY_LABEL[c]}
    </span>
  );
}

export function TypeChip({ t }: { t: SkillType }) {
  return (
    <span className="rounded-md border border-line px-1.5 py-0.5 text-[11px] font-medium text-ink-500">
      {TYPE_LABEL[t]}
    </span>
  );
}

export const AXIS_COLOR: Record<Axis, string> = {
  FIND: "bg-brand-500",
  UNDERSTAND: "bg-accent-500",
  MANAGE: "bg-brand-700",
  PROTECT: "bg-risk-medium",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${btnClass(variant, size)} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <Link href={href} className={`${btnClass(variant, size)} ${className}`}>
      {children}
    </Link>
  );
}

export function btnClass(variant: string, size: string) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45";
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-[12px]",
    md: "px-4 py-2.5 text-[13px]",
    lg: "px-5 py-3.5 text-[14px]",
  };
  const variants: Record<string, string> = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-[0_6px_16px_-8px_rgba(18,184,134,0.7)]",
    secondary: "border border-line bg-surface text-ink-700 hover:border-brand-300 hover:text-brand-700",
    ghost: "text-ink-500 hover:bg-canvas hover:text-ink-900",
    danger: "border border-risk-high-bg bg-risk-high-bg text-risk-high hover:brightness-95",
  };
  return `${base} ${sizes[size]} ${variants[variant]}`;
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: string;
  title: string;
  desc: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="text-3xl">{icon}</div>
      <p className="text-[14px] font-semibold text-ink-900">{title}</p>
      <p className="max-w-sm text-[13px] leading-relaxed text-ink-500">{desc}</p>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

export function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "brand" }) {
  return (
    <div className="rounded-xl bg-canvas px-3 py-2.5">
      <p className="text-[11px] text-ink-400">{label}</p>
      <p className={`mt-0.5 text-[15px] font-bold ${tone === "brand" ? "text-brand-700" : "text-ink-900"}`}>{value}</p>
    </div>
  );
}
