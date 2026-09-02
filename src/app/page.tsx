"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore, Loading } from "@/components/StoreProvider";
import { recommendKit, recommendSkills } from "@/lib/recommend";
import { FINKITS, PERSONA_MAP } from "@/lib/data/personas";
import { Card, IconTile, LinkButton, SectionHeader, Stat } from "@/components/ui";
import { HeroArt } from "@/components/Logo";
import { SkillCard, SkillChip } from "@/components/SkillCard";
import { SkillDna } from "@/components/SkillDna";
import { InstallKitButton, ResetDemoButton } from "@/components/actions";

/** 화면 01. Home — 서비스 진입 및 개인화 추천 (README §27) */
export default function HomePage() {
  const router = useRouter();
  const { state, ready, catalog } = useStore();

  // Persona 를 아직 설정하지 않았으면 온보딩부터 (Flow A)
  useEffect(() => {
    if (ready && (!state.profile || !state.personaId)) router.replace("/onboarding");
  }, [ready, state.profile, state.personaId, router]);

  if (!ready || !state.profile || !state.personaId) return <Loading />;

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
      {/* Greeting + Hero (시안: 홈/대시보드) */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">
            안녕하세요, {persona.name}님!
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {state.profile.region} · {state.profile.housing} · 보유 스킬 {installedSkills.length}개
          </p>
        </div>
        <div className="flex items-center gap-1">
          <LinkButton href="/onboarding" variant="secondary" size="sm">
            Persona 다시 설정
          </LinkButton>
          <ResetDemoButton />
        </div>
      </header>

      <section className="hero-gradient flex items-center justify-between gap-4 overflow-hidden rounded-[1.25rem] px-6 py-6 md:px-8">
        <div className="min-w-0">
          <p className="text-[20px] font-extrabold leading-snug tracking-tight text-ink-900 md:text-[23px]">
            필요한 <span className="text-brand-600">스킬</span>을 연결해
            <br />
            나만의 <span className="text-accent-600">금융 에이전트</span>를 완성하세요.
          </p>
          <div className="mt-4">
            {agent ? (
              <LinkButton href={`/agents/${agent.id}/chat`} size="md">
                에이전트와 대화하기
              </LinkButton>
            ) : (
              <LinkButton href="/agents/new" size="md">
                ＋ 에이전트 만들기
              </LinkButton>
            )}
          </div>
        </div>
        <div className="hidden sm:block">
          <HeroArt />
        </div>
      </section>

      {/* My Agent */}
      <section>
        <SectionHeader
          title="나의 에이전트"
          desc="스킬을 장착해 만든 나만의 금융 AI 입니다."
          action={
            agent ? (
              <LinkButton href={`/agents/${agent.id}/chat`} size="sm">
                대화 시작
              </LinkButton>
            ) : (
              <LinkButton href="/agents/new" size="sm">
                에이전트 만들기
              </LinkButton>
            )
          }
        />
        {agent ? (
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon name="bot" size={24} />
                </span>
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
                    className="inline-flex items-center gap-1.5 rounded-lg bg-canvas px-2 py-1 text-[11px] font-medium text-ink-700"
                  >
                    <Icon name={s.icon as never} size={13} />
                    {s.name}
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
              {persona.name}에게 자주 필요한 Skill {kitMissing.length}개가 아직 없습니다.
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

      {/* 추천 FinKit — 시안의 4열 카드 */}
      <section>
        <SectionHeader
          title="추천 FinKit"
          desc={`"${state.profile.region}에서 ${state.profile.housing} 중인 ${persona.name}에게 많이 필요한 Skill 묶음입니다."`}
          action={
            <Link href="/finkits" className="text-[12px] font-semibold text-brand-700 hover:underline">
              전체 보기 →
            </Link>
          }
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FINKITS.map((k) => {
            const missing = k.skillIds.filter((id) => !installedIds.has(id));
            return (
              <Card as="li" key={k.id} hover className="flex flex-col p-4">
                <IconTile icon={k.icon} category="housing" size={40} />
                <p className="mt-3 text-[14px] font-bold text-ink-900">{k.name}</p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-500">{k.tagline}</p>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                  <span className="text-[11.5px] font-semibold text-ink-400">{k.skillIds.length}개 스킬</span>
                  {missing.length === 0 ? (
                    <span className="text-[11.5px] font-bold text-brand-600">보유 중</span>
                  ) : (
                    <Link href="/finkits" className="text-[11.5px] font-bold text-accent-600 hover:underline">
                      {missing.length}개 부족
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </ul>
      </section>

      {/* 추천 Skill */}
      {recommended.length > 0 && (
        <section>
          <SectionHeader
            title="추천 스킬"
            desc="스킬 = 에이전트에 장착하는 금융 능력 하나. 관심 분야를 기준으로 정렬했습니다."
            action={
              <Link href="/shop" className="text-[12px] font-semibold text-brand-700 hover:underline">
                스킬샵
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
          <SectionHeader title="최근 사용한 스킬" desc="에이전트가 최근 대화에서 실행한 스킬입니다." />
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

