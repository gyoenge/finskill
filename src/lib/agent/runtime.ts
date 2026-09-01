import type { Agent, ChatMessage, Skill, SkillGap, TraceStep } from "@/lib/types";
import { runSkill } from "@/lib/agent/executor";
import { routeSkills } from "@/lib/agent/router";
import { complete, completeStream, llmAvailable } from "@/lib/llm";

/**
 * Agent Runtime (README §33)
 *
 *   User → Agent → Intent/Tool Selection → Skill Router → Skill Executor
 *   → API/RAG/Calculator → Structured Result → LLM → User Response
 *
 * LLM 은 (1) Skill 선택 과 (2) 결과 설명 두 지점에만 관여한다.
 * 검색·계산·자격판정은 전부 Skill Executor 가 수행하고, 그 결과가 Trace 로 노출된다.
 */

export interface RuntimeOutput {
  message: ChatMessage;
  usedSkillIds: string[];
}

const ANSWER_SYSTEM = (agent: Agent) => `너는 FinSkill 플랫폼 위에서 동작하는 개인 금융 Agent 다.

[Agent 이름] ${agent.name}
[Persona] ${agent.persona}
[역할 지침] ${agent.instructions}

절대 규칙:
1. 아래 [Skill 실행 결과] 에 있는 사실만 근거로 답한다. 결과에 없는 공고명·금액·금리·마감일을 지어내지 않는다.
2. 숫자는 Skill 이 계산한 값을 그대로 인용한다. 직접 계산해서 다른 값을 쓰지 않는다.
3. Skill 실행 결과가 비어 있으면 모른다고 말하고, 어떤 정보를 알려주면 도울 수 있는지 되묻는다.
4. 특정 금융상품 가입을 권유하거나 투자 자문을 하지 않는다. 선택지와 판단 기준만 제시한다.
5. 신청·계약·송금은 FinSkill 이 대신 할 수 없다는 점을 필요할 때 분명히 말한다.

작성 형식:
- 한국어 존댓말, 400자 내외.
- 결론을 첫 문장에 쓴다.
- 항목이 여러 개면 '- ' 불릿으로 최대 4개까지만 추린다.
- 마지막 줄에 사용자가 바로 할 수 있는 다음 행동 한 가지를 제안한다.
- 출처를 본문에 나열하지 않는다. 출처는 UI 가 Skill Trace 로 따로 표시한다.`;

function fallbackAnswer(agent: Agent, query: string, traces: TraceStep[], gap: SkillGap | undefined): string {
  if (!traces.length) {
    return gap?.missing.length
      ? `이 요청을 처리할 Skill 이 아직 ${agent.name}에 장착되어 있지 않습니다. 아래 추천 Skill 을 장착하면 바로 이어서 도와드릴 수 있습니다.`
      : `무엇을 도와드릴까요? 금융용어 설명, 청년주택·장학금·청년정책 검색, 적금 계산, 소비 분석 같은 요청을 처리할 수 있습니다.`;
  }
  const lines = traces.map((t) => `【${t.skillName}】\n${String((t as unknown as { facts?: string }).facts ?? t.summary)}`);
  return [
    `요청하신 내용을 ${traces.length}개의 Skill 로 처리했습니다.`,
    "",
    ...lines,
    "",
    llmAvailable()
      ? "※ LLM 응답을 받지 못해 Skill 실행 결과를 그대로 보여드리고 있습니다. (API 키·네트워크를 확인해주세요)"
      : "※ LLM 키가 설정되지 않아 Skill 실행 결과를 그대로 보여드리고 있습니다. .env.local 에 ANTHROPIC_API_KEY 를 넣으면 Agent 가 이 결과를 요약해 설명합니다.",
  ].join("\n");
}

export async function runAgent(params: {
  agent: Agent;
  query: string;
  equipped: Skill[];
  catalog: Skill[];
  history: ChatMessage[];
  /** Skill Detail / Builder 등에서 넘어온 명시적 입력값 */
  extraParams?: Record<string, unknown>;
  /**
   * 스트리밍 훅. 넘기면 각 단계가 끝나는 즉시 호출되어 UI 가 점진적으로 그릴 수 있다.
   * 넘기지 않으면 기존과 동일하게 완성된 결과만 반환한다.
   */
  hooks?: {
    /** Skill 실행이 끝난 직후 — Trace 를 먼저 띄워 답변 대기 시간을 채운다 */
    onTrace?: (trace: TraceStep[]) => void;
    onGap?: (gap: SkillGap) => void;
    /** 답변 토큰이 도착할 때마다 */
    onDelta?: (text: string) => void;
    /** 지금까지 흘려보낸 본문을 버리라는 신호 (스트리밍 도중 실패 시) */
    onReset?: () => void;
  };
}): Promise<RuntimeOutput> {
  const { agent, query, equipped, catalog, history, extraParams, hooks } = params;

  // 1) Intent 분석 + Skill 선택 + Skill Gap 탐지
  const decision = await routeSkills(query, equipped, catalog);

  // 2) Skill 실행 (deterministic)
  const traces: (TraceStep & { facts: string })[] = [];
  for (const id of decision.selected) {
    const skill = equipped.find((s) => s.id === id);
    if (!skill) continue;
    const r = runSkill(skill, query, extraParams ?? {});
    traces.push({
      skillId: skill.id,
      skillName: skill.name,
      icon: skill.icon,
      executor: skill.executor.type,
      summary: r.summary,
      sources: r.sources,
      data: r.data,
      ms: r.ms,
      facts: r.facts,
    });
  }

  // Skill 실행 결과는 답변 생성보다 훨씬 빨리 나오므로 먼저 내보낸다.
  hooks?.onTrace?.(traces.map(({ facts: _facts, ...t }) => t));

  // 3) Skill Gap 구성 (§14)
  const gap: SkillGap | undefined = decision.missing.length
    ? {
        message: `이 요청을 완전히 해결하려면 ${decision.missing.length}개의 Skill 이 더 필요합니다.`,
        missing: decision.missing.map((m) => {
          const s = catalog.find((c) => c.id === m.skillId)!;
          return { skillId: s.id, name: s.name, icon: s.icon, reason: m.reason };
        }),
      }
    : undefined;
  if (gap) hooks?.onGap?.(gap);

  // 4) 결과 설명 (LLM)
  let content: string | null = null;
  /** 스트리밍으로 실제 내보낸 글자 수 — 중간 실패 시 롤백 판단에 쓴다 */
  let streamed = 0;
  if (llmAvailable()) {
    const recent = history
      .slice(-6)
      .map((m) => `${m.role === "user" ? "사용자" : "Agent"}: ${m.content}`)
      .join("\n");
    const user = [
      recent ? `[최근 대화]\n${recent}\n` : "",
      `[사용자 요청]\n${query}\n`,
      `[Skill 실행 결과]`,
      traces.length
        ? traces.map((t) => `### ${t.skillName} (${t.executor})\n${t.facts}`).join("\n\n")
        : "(실행된 Skill 없음 — 사실 근거가 없습니다)",
      gap ? `\n[부족한 Skill]\n${gap.missing.map((m) => `- ${m.name}: ${m.reason}`).join("\n")}\n부족한 Skill 이 있다면 답변 마지막에 무엇이 더 필요한지 한 문장으로 알린다.` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const llmOpts = { system: ANSWER_SYSTEM(agent), user, maxTokens: 8000, effort: "medium" as const };
    if (hooks?.onDelta) {
      const onDelta = hooks.onDelta;
      content = await completeStream(llmOpts, (t) => {
        streamed += t.length;
        onDelta(t);
      });
    } else {
      content = await complete(llmOpts);
    }
  }

  // LLM 이 실패하면 Fallback 답변을 대신 내보낸다.
  // 스트리밍 도중 끊긴 경우에는 이미 흘려보낸 부분 텍스트를 먼저 버려야
  // 잘린 문장 뒤에 Fallback 이 덧붙는 뒤섞임을 막을 수 있다.
  if (hooks?.onDelta && content === null) {
    if (streamed > 0) hooks.onReset?.();
    hooks.onDelta(fallbackAnswer(agent, query, traces, gap));
  }

  const message: ChatMessage = {
    id: `msg_${Date.now().toString(36)}_a`,
    role: "agent",
    content: content ?? fallbackAnswer(agent, query, traces, gap),
    trace: traces.map(({ facts: _facts, ...t }) => t),
    gap,
    sources: Array.from(new Set(traces.flatMap((t) => t.sources))),
    createdAt: new Date().toISOString(),
  };

  return { message, usedSkillIds: decision.selected };
}
