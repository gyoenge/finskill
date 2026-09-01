"use client";

import Link from "next/link";
import { useStore, Loading } from "@/components/StoreProvider";
import { Card, EmptyState, LinkButton, Stat } from "@/components/ui";
import { DeleteAgentButton } from "@/components/actions";
import { SkillDna } from "@/components/SkillDna";

/** My Agent 목록 */
export default function AgentsPage() {
  const { state, ready, catalog } = useStore();
  if (!ready) return <Loading />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">나의 에이전트</h1>
          <p className="mt-1 text-[13px] text-ink-500">장착한 Skill 을 조합해 금융문제를 해결하는 나만의 Agent 입니다.</p>
        </div>
        <LinkButton href="/agents/new" size="sm">
          ＋ 에이전트 만들기
        </LinkButton>
      </header>

      {state.agents.length === 0 ? (
        <EmptyState
          icon="🤖"
          title="아직 Agent 가 없습니다"
          desc="Persona 와 Skill 을 골라 첫 번째 금융 Agent 를 만들어보세요."
          action={<LinkButton href="/agents/new">Agent Builder 열기</LinkButton>}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {state.agents.map((a) => {
            const skills = catalog.filter((s) => a.skillIds.includes(s.id));
            const messages = state.chats[a.id]?.length ?? 0;
            return (
              <Card as="li" key={a.id} className="flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-[22px]">🤖</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-ink-900">{a.name}</p>
                    <p className="truncate text-[12px] text-ink-500">{a.persona}</p>
                  </div>
                  <DeleteAgentButton agentId={a.id} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Stat label="Skill" value={`${skills.length}개`} tone="brand" />
                  <Stat label="대화" value={`${Math.floor(messages / 2)}턴`} />
                  <Stat label="모델" value={a.model.replace("claude-", "")} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {skills.slice(0, 5).map((s) => (
                    <span key={s.id} className="rounded-lg bg-canvas px-2 py-1 text-[11px] font-medium text-ink-700">
                      {s.icon} {s.name}
                    </span>
                  ))}
                  {skills.length > 5 && (
                    <span className="rounded-lg bg-canvas px-2 py-1 text-[11px] text-ink-400">
                      +{skills.length - 5}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex gap-2 border-t border-line pt-3">
                  <LinkButton href={`/agents/${a.id}/chat`} size="sm" className="flex-1">
                    대화하기
                  </LinkButton>
                  <Link
                    href="/my-skills"
                    className="rounded-xl border border-line px-3 py-1.5 text-[12px] font-semibold text-ink-500 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    Skill 관리
                  </Link>
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      {state.agents.length > 0 && (
        <SkillDna
          skills={catalog.filter((s) => state.agents.some((a) => a.skillIds.includes(s.id)))}
          catalog={catalog}
        />
      )}
    </div>
  );
}
