import Link from "next/link";
import { redirect } from "next/navigation";
import { allSkills, readState } from "@/lib/store";
import { recommendKit, recommendSkills } from "@/lib/recommend";
import { PERSONA_MAP } from "@/lib/data/personas";
import { Card, LinkButton, SectionHeader, Stat } from "@/components/ui";
import { SkillCard, SkillChip } from "@/components/SkillCard";
import { SkillDna } from "@/components/SkillDna";
import { InstallKitButton, ResetDemoButton } from "@/components/actions";
import { llmAvailable } from "@/lib/llm";

/** 화면 01. Home — 서비스 진입 및 개인화 추천 (README §27) */
export const dynamic = "force-dynamic";

export default function HomePage() {
  const state = readState();
  if (!state.profile || !state.personaId) redirect("/onboarding");

  const catalog = allSkills(state);
  const persona = PERSONA_MAP[state.personaId];
  const installedIds = new Set(state.installed.map((i) => i.skillId));
  const installedSkills = catalog.filter((s) => installedIds.has(s.id));

  const kit = recommendKit(state.personaId);
  const kitMissing = kit.skillIds.filter((id) => !installedIds.has(id));
  const recommended = recommendSkills(catalog, {
    personaId: state.personaId,
    profile: state.profile,
    exclude: [...installedIds],
  }).slice(0, 4);

  const agent = state.agents.find((a) => a.id === state.activeAgentId) ?? state.agents[0];
  const agentSkills = agent ? catalog.filter((s) => agent.skillIds.includes(s.id)) : [];
  const recent = state.recentSkillIds
    .map((id) => catalog.find((c) => c.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-brand-600">
            {persona.icon} {persona.name} · {state.profile.region} · {state.profile.housing}
          </p>
          <h1 className="mt-1 text-[22px] font-extrabold leading-tight tracking-tight text-ink-900">
            안녕하세요, 오늘도 필요한 금융 능력을
            <br className="hidden sm:block" /> 하나씩 연결해볼까요?
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-500">
            현재 {installedSkills.length}개의 Skill 을 보유하고 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <LinkButton href="/onboarding" variant="secondary" size="sm">
            Persona 다시 설정
          </LinkButton>
          <ResetDemoButton />
        </div>
      </header>

      {!llmAvailable() && (
        <Card className="border-risk-medium-bg bg-risk-medium-bg px-4 py-3">
          <p className="text-[12px] leading-relaxed text-risk-medium">
            <b>LLM 키 미설정</b> — Skill 라우팅·실행·Trace·Gap 은 모두 동작하지만, Agent 의 자연어 요약은 비활성화되어
            Skill 실행 결과가 그대로 표시됩니다. <code className="rounded bg-white/60 px-1">.env.local</code> 에{" "}
            <code className="rounded bg-white/60 px-1">ANTHROPIC_API_KEY</code> 를 넣으면 활성화됩니다.
          </p>
        </Card>
      )}

      {/* My Agent */}
      <section>
        <SectionHeader
          title="My Agent"
          desc="Persona + Instructions + Skill Set + LLM 으로 구성된 나만의 금융 Agent"
          action={
            agent ? (
              <LinkButton href={`/agents/${agent.id}/chat`} size="sm">
                대화 시작
              </LinkButton>
            ) : (
              <LinkButton href="/agents/new" size="sm">
                Agent 만들기
              </LinkButton>
            )
          }
        />
        {agent ? (
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="puzzle-piece flex h-12 w-12 shrink-0 items-center justify-center bg-brand-500 text-[22px]">
                  🤖
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-ink-900">{agent.name}</p>
                  <p className="text-[12px] text-ink-500">{agent.persona}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-ink-500">{agent.instructions}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Stat label="장착 Skill" value={`${agentSkills.length}개`} tone="brand" />
                <Stat label="데이터 출처" value={`${new Set(agentSkills.flatMap((s) => s.dataSources)).size}곳`} />
                <Stat label="금융실행 권한" value="없음" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {agentSkills.slice(0, 6).map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-canvas px-2 py-1 text-[11px] font-medium text-ink-700"
                  >
                    {s.icon} {s.name}
                  </span>
                ))}
                {agentSkills.length === 0 && (
                  <span className="text-[11.5px] text-ink-400">아직 장착된 Skill 이 없습니다.</span>
                )}
              </div>
            </Card>
            <SkillDna skills={agentSkills} catalog={catalog} compact />
          </div>
        ) : (
          <Card className="flex flex-col items-start gap-3 p-5">
            <p className="text-[13px] text-ink-500">
              추천 FinKit 을 설치하면 {persona.name} 용 Agent 를 바로 만들 수 있습니다.
            </p>
            <LinkButton href="/agents/new">Agent Builder 열기</LinkButton>
          </Card>
        )}
      </section>

      {/* Skill Gap 알림 */}
      {agentSkills.length > 0 && kitMissing.length > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-accent-200 bg-accent-50 p-4">
          <div>
            <p className="text-[13px] font-bold text-accent-700">
              🧩 {persona.name}에게 자주 필요한 Skill {kitMissing.length}개가 아직 없습니다.
            </p>
            <p className="mt-0.5 text-[12px] text-accent-700/80">
              {kitMissing
                .map((id) => catalog.find((c) => c.id === id)?.name)
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <InstallKitButton skillIds={kitMissing} label="부족한 Skill 한 번에 설치" />
        </Card>
      )}

      {/* 추천 FinKit */}
      <section>
        <SectionHeader
          title="추천 FinKit"
          desc={`"${state.profile.region}에서 ${state.profile.housing} 중인 ${persona.name}에게 많이 필요한 Skill 묶음입니다."`}
          action={
            <Link href="/finkits" className="text-[12px] font-semibold text-brand-700 hover:underline">
              전체 보기
            </Link>
          }
        />
        <Card className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="puzzle-piece flex h-12 w-12 shrink-0 items-center justify-center bg-brand-50 text-[22px]">
                {kit.icon}
              </div>
              <div>
                <p className="text-[15px] font-bold text-ink-900">{kit.name}</p>
                <p className="text-[12px] text-ink-500">{kit.tagline}</p>
              </div>
            </div>
            {kitMissing.length > 0 ? (
              <InstallKitButton skillIds={kitMissing} />
            ) : (
              <span className="rounded-xl bg-brand-50 px-3 py-2 text-[12px] font-semibold text-brand-700">
                ✓ 전부 설치됨
              </span>
            )}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-500">{kit.reason}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {kit.skillIds.map((id) => {
              const s = catalog.find((c) => c.id === id);
              if (!s) return null;
              return (
                <li key={id}>
                  <SkillChip
                    skill={s}
                    right={
                      installedIds.has(id) ? (
                        <span className="shrink-0 text-[11px] font-semibold text-brand-600">보유</span>
                      ) : (
                        <span className="shrink-0 text-[11px] text-ink-300">미보유</span>
                      )
                    }
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* 추천 Skill */}
      {recommended.length > 0 && (
        <section>
          <SectionHeader
            title="추천 Skill"
            desc="Persona 와 관심 분야를 기준으로 정렬했습니다."
            action={
              <Link href="/shop" className="text-[12px] font-semibold text-brand-700 hover:underline">
                Skill Shop
              </Link>
            }
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {recommended.map((s) => (
              <SkillCard key={s.id} skill={s} installed={installedIds.has(s.id)} />
            ))}
          </ul>
        </section>
      )}

      {/* 최근 사용 Skill */}
      {recent.length > 0 && (
        <section>
          <SectionHeader title="최근 사용한 Skill" desc="Agent 가 최근 대화에서 실행한 Skill 입니다." />
          <ul className="grid gap-2 sm:grid-cols-2">
            {recent.map((s) => (
              <li key={s.id}>
                <SkillChip
                  skill={s}
                  right={
                    <Link href={`/shop/${s.id}`} className="shrink-0 text-[11px] font-semibold text-ink-400 hover:text-brand-700">
                      Passport
                    </Link>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
