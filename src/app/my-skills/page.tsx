"use client";

import Link from "next/link";
import { useStore, Loading } from "@/components/StoreProvider";
import { SKILL_MAP } from "@/lib/data/skills";
import { AXIS_LABEL, AXIS_SHORT, TYPE_TO_AXIS } from "@/lib/data/personas";
import type { Axis } from "@/lib/types";
import { Card, EmptyState, IconTile, LinkButton, RiskBadge, SectionHeader, VerifiedBadge } from "@/components/ui";
import { RemoveSkillButton, ToggleSkill } from "@/components/actions";
import { EquipControl } from "@/components/EquipControl";
import { SkillDna } from "@/components/SkillDna";

/** 화면 04. My Skills (README §10, §27) */
export default function MySkillsPage() {
  const { state, ready, catalog } = useStore();
  const rows = state.installed
    .map((i) => ({ install: i, skill: catalog.find((c) => c.id === i.skillId) }))
    .filter((r): r is { install: (typeof state.installed)[number]; skill: NonNullable<(typeof catalog)[number]> } =>
      Boolean(r.skill),
    );

  const enabledSkills = rows.filter((r) => r.install.enabled).map((r) => r.skill);

  // 설치 목록이 아니라 "내 Agent 의 능력 목록" 으로 보이도록 4개 축으로 묶는다 (§6.2, §17)
  const AXES: Axis[] = ["FIND", "UNDERSTAND", "MANAGE", "PROTECT"];
  const grouped = AXES.map((axis) => ({
    axis,
    rows: rows.filter((r) => r.skill.type.some((t) => TYPE_TO_AXIS[t] === axis)),
  }));

  if (!ready) return <Loading />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">나의 스킬</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            내가 보유한 스킬을 관리하고 조합해 보세요. 총 {rows.length}개 보유 중.
          </p>
        </div>
        <LinkButton href="/shop" variant="secondary" size="sm">
          ＋ 스킬 추가
        </LinkButton>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon="🎒"
          title="아직 설치한 Skill 이 없습니다"
          desc="Skill Shop 에서 필요한 능력을 찾거나, FinKit 을 설치해 한 번에 갖출 수 있습니다."
          action={<LinkButton href="/finkits">추천 FinKit 보기</LinkButton>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-5">
            {grouped.map(({ axis, rows: group }) => (
              <section key={axis}>
                <div className="mb-2 flex items-baseline gap-2">
                  <h2 className="text-[13px] font-bold text-ink-900">{AXIS_SHORT[axis]}</h2>
                  <span className="text-[11.5px] text-ink-400">
                    {group.length}개 · {AXIS_LABEL[axis]}
                  </span>
                </div>
                {group.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-[12px] text-ink-400">
                    이 능력이 아직 없습니다.{" "}
                    <Link href="/shop" className="font-semibold text-brand-700 hover:underline">
                      스킬샵에서 찾기 →
                    </Link>
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {group.map(({ install, skill }) => {
              const latest = SKILL_MAP[skill.id]?.version ?? skill.version;
              const outdated = latest !== install.version;
              return (
                <Card as="li" key={skill.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className={install.enabled ? "" : "grayscale"}>
                      <IconTile icon={skill.icon} category={skill.category[0]} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link href={`/shop/${skill.id}`} className="text-[14px] font-bold text-ink-900 hover:text-brand-700">
                          {skill.name}
                        </Link>
                        <span className="rounded bg-canvas px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-400">
                          v{install.version}
                        </span>
                        {outdated && (
                          <span className="rounded bg-accent-50 px-1.5 py-0.5 text-[10.5px] font-bold text-accent-700">
                            업데이트 v{latest}
                          </span>
                        )}
                        {skill.custom && (
                          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-bold text-brand-700">
                            내가 만든 Skill
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-ink-500">{skill.tagline}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <VerifiedBadge verified={skill.verified} />
                        <RiskBadge level={skill.risk} compact />
                        <Link
                          href={`/shop/${skill.id}`}
                          className="text-[11px] font-semibold text-ink-400 underline-offset-2 hover:text-brand-700 hover:underline"
                        >
                          Passport 확인
                        </Link>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <ToggleSkill skillId={skill.id} enabled={install.enabled} />
                      <RemoveSkillButton skillId={skill.id} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    <span className="text-[11px] font-bold text-ink-400">Agent 장착</span>
                    <EquipControl skillId={skill.id} agents={state.agents} />
                  </div>
                </Card>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="space-y-4">
            <SkillDna skills={enabledSkills} catalog={catalog} />
            <Card className="p-4">
              <SectionHeader title="권한 요약" desc="보유 중인 Skill 이 요구하는 권한입니다." />
              <ul className="space-y-1.5 text-[12px]">
                <PermRow
                  label="개인정보 접근"
                  value={`${enabledSkills.filter((s) => s.permissions.personalData).length}개 Skill`}
                />
                <PermRow
                  label="외부 통신"
                  value={`${new Set(enabledSkills.flatMap((s) => s.permissions.network)).size}개 도메인`}
                />
                <PermRow label="데이터 쓰기" value={`${enabledSkills.filter((s) => s.permissions.writeAction).length}개 Skill`} />
                <PermRow
                  label="금융 실행"
                  value={enabledSkills.some((s) => s.permissions.financialTransaction) ? "허용됨" : "없음"}
                  highlight
                />
              </ul>
              <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-[11px] leading-relaxed text-ink-500">
                FinSkill MVP 는 송금·투자주문·대출신청 같은 고위험 Action Skill 을 제공하지 않습니다. (§23)
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function PermRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-lg bg-canvas px-2.5 py-1.5">
      <span className="text-ink-500">{label}</span>
      <span className={`font-semibold ${highlight ? "text-risk-low" : "text-ink-900"}`}>{value}</span>
    </li>
  );
}
