import Link from "next/link";
import type { Skill } from "@/lib/types";
import { CategoryChip, Card, RiskBadge, TypeChip, VerifiedBadge } from "@/components/ui";
import { InstallButton } from "@/components/actions";

/** README §7.1 Skill Card */
export function SkillCard({ skill, installed }: { skill: Skill; installed: boolean }) {
  return (
    <Card
      as="li"
      className="group flex flex-col gap-3 p-4 transition hover:border-brand-300 hover:shadow-[0_6px_20px_-12px_rgba(13,27,46,0.35)]"
    >
      <div className="flex items-start gap-3">
        <div className="puzzle-piece flex h-11 w-11 shrink-0 items-center justify-center bg-brand-50 text-[20px]">
          {skill.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link href={`/shop/${skill.id}`} className="truncate text-[14px] font-bold text-ink-900 hover:text-brand-700">
              {skill.name}
            </Link>
            {skill.isNew && (
              <span className="rounded bg-accent-500 px-1 py-px text-[9px] font-bold text-white">NEW</span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-ink-500">{skill.tagline}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {skill.category.slice(0, 2).map((c) => (
          <CategoryChip key={c} c={c} />
        ))}
        {skill.type.slice(0, 2).map((t) => (
          <TypeChip key={t} t={t} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <VerifiedBadge verified={skill.verified} />
        <RiskBadge level={skill.risk} compact />
        <span className="text-[11px] text-ink-400">
          ★ {skill.rating.toFixed(1)} · {skill.installCount.toLocaleString("ko-KR")}명
        </span>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
        <p className="min-w-0 flex-1 truncate text-[11px] text-ink-400" title={skill.dataSources.join(", ")}>
          출처 {skill.dataSources[0]}
          {skill.dataSources.length > 1 && ` 외 ${skill.dataSources.length - 1}`}
        </p>
        <InstallButton skillId={skill.id} installed={installed} />
      </div>
    </Card>
  );
}

/** 좁은 공간용 압축 카드 (Home / Agent Builder) */
export function SkillChip({ skill, right }: { skill: Skill; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5">
      <span className="puzzle-piece flex h-8 w-8 shrink-0 items-center justify-center bg-brand-50 text-[15px]">
        {skill.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink-900">{skill.name}</p>
        <p className="truncate text-[11px] text-ink-400">{skill.tagline}</p>
      </div>
      {right}
    </div>
  );
}
