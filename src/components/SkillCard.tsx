import Link from "next/link";
import type { Skill } from "@/lib/types";
import { Card, FreeBadge, IconTile, Rating, RiskBadge } from "@/components/ui";
import { InstallButton } from "@/components/actions";

/** README §7.1 Skill Card */
export function SkillCard({ skill, installed }: { skill: Skill; installed: boolean }) {
  return (
    <Card as="li" hover className="group flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <IconTile icon={skill.icon} category={skill.category[0]} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/shop/${skill.id}`}
              className="truncate text-[14px] font-bold text-ink-900 hover:text-brand-700"
            >
              {skill.name}
            </Link>
            {skill.isNew && (
              <span className="rounded bg-accent-500 px-1 py-px text-[9px] font-bold text-white">NEW</span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-500">{skill.tagline}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Rating value={skill.rating} />
        <FreeBadge />
        <RiskBadge level={skill.risk} compact />
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
        <p className="min-w-0 flex-1 truncate text-[11px] text-ink-400" title={skill.dataSources.join(", ")}>
          {skill.dataSources[0]}
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
      <IconTile icon={skill.icon} category={skill.category[0]} size={34} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink-900">{skill.name}</p>
        <p className="truncate text-[11px] text-ink-400">{skill.tagline}</p>
      </div>
      {right}
    </div>
  );
}
