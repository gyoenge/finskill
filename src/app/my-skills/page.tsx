import Link from "next/link";
import { allSkills, readState } from "@/lib/store";
import { SKILL_MAP } from "@/lib/data/skills";
import { Card, EmptyState, LinkButton, RiskBadge, SectionHeader, VerifiedBadge } from "@/components/ui";
import { RemoveSkillButton, ToggleSkill } from "@/components/actions";
import { EquipControl } from "@/components/EquipControl";
import { SkillDna } from "@/components/SkillDna";

/** 화면 04. My Skills (README §10, §27) */
export const dynamic = "force-dynamic";

export default function MySkillsPage() {
  const state = readState();
  const catalog = allSkills(state);
  const rows = state.installed
    .map((i) => ({ install: i, skill: catalog.find((c) => c.id === i.skillId) }))
    .filter((r): r is { install: (typeof state.installed)[number]; skill: NonNullable<(typeof catalog)[number]> } =>
      Boolean(r.skill),
    );

  const enabledSkills = rows.filter((r) => r.install.enabled).map((r) => r.skill);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">My Skills</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            설치한 금융 능력을 관리하고 Agent 에 장착하세요. 총 {rows.length}개 보유 중.
          </p>
        </div>
        <LinkButton href="/shop" variant="secondary" size="sm">
          Skill 더 찾기
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
          <ul className="space-y-2.5">
            {rows.map(({ install, skill }) => {
              const latest = SKILL_MAP[skill.id]?.version ?? skill.version;
              const outdated = latest !== install.version;
              return (
                <Card as="li" key={skill.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`puzzle-piece flex h-11 w-11 shrink-0 items-center justify-center text-[19px] ${
                        install.enabled ? "bg-brand-50" : "bg-canvas grayscale"
                      }`}
                    >
                      {skill.icon}
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
