import type { Skill } from "@/lib/types";
import { complete, extractJson, llmAvailable } from "@/lib/llm";

/**
 * Skill Router (README §13, §14)
 *
 *   사용자 질문 → Intent 분석 → 사용 가능한 Skill 확인 → Skill 선택
 *   → (부족하면 Skill Gap) → 실행
 *
 * LLM 이 있으면 LLM 이 Skill 을 고르고, 없으면 키워드 스코어링으로 고른다.
 * 어느 쪽이든 "무엇을 실행할지" 만 정하고, 실제 실행은 executor.ts 가 한다.
 */

export interface RoutingDecision {
  intent: string;
  /** 실행할 Skill (장착된 것 중에서만) */
  selected: string[];
  /** 요청 완수를 위해 추가로 필요한 Skill (미설치/미장착) */
  missing: { skillId: string; reason: string }[];
  /** LLM 라우팅 여부 — UI 에 표시 */
  routedBy: "llm" | "rules";
}

function score(skill: Skill, query: string): number {
  const q = query.toLowerCase();
  let s = 0;
  for (const k of skill.keywords) if (q.includes(k.toLowerCase())) s += 10;
  if (q.includes(skill.name.toLowerCase())) s += 25;
  for (const c of skill.category) if (q.includes(c)) s += 2;
  return s;
}

export function ruleRoute(query: string, equipped: Skill[], catalog: Skill[]): RoutingDecision {
  const ranked = equipped
    .map((s) => ({ s, v: score(s, query) }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v);

  // 최상위 점수의 절반에 못 미치는 매칭은 오탐일 가능성이 높아 제외한다.
  // (예: "저금리 대환대출" 문자에서 "금리"만 걸린 예·적금 Skill)
  const cutoff = ranked.length ? Math.max(10, ranked[0].v * 0.5) : 0;
  const selected = ranked
    .filter((x) => x.v >= cutoff)
    .slice(0, 4)
    .map((x) => x.s.id);

  const equippedIds = new Set(equipped.map((s) => s.id));
  const missing = catalog
    .filter((s) => !equippedIds.has(s.id))
    .map((s) => ({ s, v: score(s, query) }))
    .filter((x) => x.v >= 10)
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .map((x) => ({
      skillId: x.s.id,
      reason: `"${x.s.keywords.find((k) => query.toLowerCase().includes(k.toLowerCase())) ?? x.s.name}" 관련 요청을 처리하려면 ${x.s.name} 능력이 필요합니다.`,
    }));

  return {
    intent: selected.length ? "금융 정보 요청" : "일반 대화",
    selected,
    missing,
    routedBy: "rules",
  };
}

const ROUTER_SYSTEM = `너는 FinSkill 플랫폼의 Skill Router 다.
사용자의 금융 요청을 읽고, 요청을 해결하는 데 필요한 Skill 을 고르는 일만 한다.
답변을 직접 작성하지 않는다. 금융 계산이나 검색을 스스로 하지 않는다.

규칙:
1. selected 에는 "장착된 Skill" 목록에 있는 id 만 넣는다. 최대 4개.
2. 요청을 완전히 해결하려면 필요한데 장착되지 않은 Skill 이 있으면 missing 에 넣는다. 최대 3개.
3. 장착된 Skill 로 충분하면 missing 은 빈 배열이다.
4. 인사, 잡담, Skill 과 무관한 질문이면 selected 와 missing 을 모두 빈 배열로 둔다.
5. 반드시 아래 JSON 만 출력한다.

{"intent":"한 줄 요약","selected":["skill-id"],"missing":[{"skillId":"skill-id","reason":"왜 필요한지 한 문장"}]}`;

export async function routeSkills(
  query: string,
  equipped: Skill[],
  catalog: Skill[],
): Promise<RoutingDecision> {
  if (!llmAvailable()) return ruleRoute(query, equipped, catalog);

  const equippedIds = new Set(equipped.map((s) => s.id));
  const describe = (s: Skill) =>
    `- ${s.id} | ${s.name} | ${s.tagline} | type: ${s.type.join(",")} | 할 수 있는 것: ${s.passport.canDo.join(", ")}`;

  const user = [
    `[장착된 Skill]`,
    equipped.length ? equipped.map(describe).join("\n") : "(없음)",
    ``,
    `[설치 가능한 Skill (아직 장착되지 않음)]`,
    catalog.filter((s) => !equippedIds.has(s.id)).map(describe).join("\n") || "(없음)",
    ``,
    `[사용자 요청]`,
    query,
  ].join("\n");

  const raw = await complete({ system: ROUTER_SYSTEM, user, maxTokens: 700, temperature: 0 });
  const parsed = extractJson<{
    intent?: string;
    selected?: string[];
    missing?: { skillId: string; reason: string }[];
  }>(raw);

  if (!parsed) return ruleRoute(query, equipped, catalog);

  const catalogIds = new Set(catalog.map((s) => s.id));
  return {
    intent: parsed.intent ?? "금융 요청",
    selected: (parsed.selected ?? []).filter((id) => equippedIds.has(id)).slice(0, 4),
    missing: (parsed.missing ?? [])
      .filter((m) => m && catalogIds.has(m.skillId) && !equippedIds.has(m.skillId))
      .slice(0, 3),
    routedBy: "llm",
  };
}
