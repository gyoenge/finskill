import Link from "next/link";
import type { Skill } from "@/lib/types";
import { analyzeDna, computeDna } from "@/lib/recommend";
import { AXIS_COLOR, Card } from "@/components/ui";
import { AXIS_LABEL } from "@/lib/data/personas";

/** Skill DNA (README §17) — Agent 의 금융 능력을 4개 축으로 시각화한다. */
export function SkillDna({
  skills,
  catalog,
  compact = false,
}: {
  skills: Skill[];
  catalog: Skill[];
  compact?: boolean;
}) {
  const dna = computeDna(skills);
  const analysis = analyzeDna(dna, catalog, skills.map((s) => s.id));

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-ink-900">Skill DNA</h3>
        <span className="text-[11px] text-ink-400">장착 Skill {skills.length}개 기준</span>
      </div>

      <ul className="space-y-2.5">
        {dna.map((d) => (
          <li key={d.axis}>
            <div className="flex items-baseline justify-between">
              <span className="text-[11.5px] font-bold tracking-wide text-ink-700">{d.axis}</span>
              <span className="text-[11.5px] font-bold text-ink-900">{d.score}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-canvas">
              <div className={`dna-bar h-full rounded-full ${AXIS_COLOR[d.axis]}`} style={{ width: `${d.score}%` }} />
            </div>
            {!compact && <p className="mt-0.5 text-[10.5px] text-ink-400">{AXIS_LABEL[d.axis]}</p>}
          </li>
        ))}
      </ul>

      <div className="mt-3.5 rounded-xl bg-canvas px-3 py-2.5">
        <p className="text-[11.5px] leading-relaxed text-ink-700">
          <span className="font-semibold">AI 분석 · </span>
          {analysis.text}
        </p>
        {analysis.suggestion && (
          <Link
            href={`/shop/${analysis.suggestion.id}`}
            className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand-700 hover:underline"
          >
            ＋ {analysis.suggestion.name} 보러가기
          </Link>
        )}
      </div>
    </Card>
  );
}
