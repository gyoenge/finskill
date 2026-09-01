import type { Axis, OnboardingProfile, PersonaId, Skill } from "@/lib/types";
import { FINKITS, PERSONAS, TYPE_TO_AXIS } from "@/lib/data/personas";

/**
 * Persona 기반 추천 (README §9) 과 Skill DNA (README §17).
 * MVP 는 규칙 기반이며, 이후 사용자 행동 데이터 기반 모델로 교체할 수 있도록
 * 순수 함수로 분리해 두었다.
 */

export function matchPersona(profile: OnboardingProfile): { personaId: PersonaId; reason: string } {
  const scores = PERSONAS.map((p) => {
    let score = 0;
    const hits: string[] = [];
    if (p.match.status?.includes(profile.status)) {
      score += 40;
      hits.push(profile.status);
    }
    if (p.match.housing?.includes(profile.housing)) {
      score += 35;
      hits.push(profile.housing);
    }
    if (p.match.knowledge?.includes(profile.knowledge)) {
      score += 30;
      hits.push(`금융지식 ${profile.knowledge}`);
    }
    const interestHits = (p.match.interests ?? []).filter((c) => profile.interests.includes(c));
    score += interestHits.length * 12;
    return { p, score, hits };
  }).sort((a, b) => b.score - a.score);

  const top = scores[0];
  const where = profile.region;
  const reason = top.hits.length
    ? `${where}에 거주하는 ${top.hits.join(" · ")} 조건에 가장 가까운 Persona 입니다.`
    : `선택하신 관심 분야를 기준으로 매칭했습니다.`;

  return { personaId: top.p.id, reason };
}

export function recommendKit(personaId: PersonaId) {
  return FINKITS.find((k) => k.persona === personaId) ?? FINKITS[0];
}

/** Persona + 관심분야로 추천 Skill 을 정렬한다. */
export function recommendSkills(
  catalog: Skill[],
  opts: { personaId: PersonaId | null; profile: OnboardingProfile | null; exclude?: string[] },
): Skill[] {
  const exclude = new Set(opts.exclude ?? []);
  return catalog
    .filter((s) => !exclude.has(s.id))
    .map((s) => {
      let v = s.rating * 2 + Math.log10(s.installCount + 1) * 3;
      if (opts.personaId && s.personas.includes(opts.personaId)) v += 30;
      if (opts.profile) {
        const overlap = s.category.filter((c) => opts.profile!.interests.includes(c)).length;
        v += overlap * 14;
        if (opts.profile.housing === "자취" && s.category.includes("housing")) v += 10;
        if (opts.profile.knowledge === "처음이에요" && s.category.includes("literacy")) v += 10;
      }
      return { s, v };
    })
    .sort((a, b) => b.v - a.v)
    .map((x) => x.s);
}

export interface DnaScore {
  axis: Axis;
  score: number;
  skillIds: string[];
}

/** Skill DNA — 장착된 Skill 의 type 분포를 4개 축 점수로 환산한다. */
export function computeDna(skills: Skill[]): DnaScore[] {
  const axes: Axis[] = ["FIND", "UNDERSTAND", "MANAGE", "PROTECT"];
  return axes.map((axis) => {
    const contributors = skills.filter((s) => s.type.some((t) => TYPE_TO_AXIS[t] === axis));
    const occurrences = skills.reduce(
      (acc, s) => acc + s.type.filter((t) => TYPE_TO_AXIS[t] === axis).length,
      0,
    );
    const quality = contributors.reduce((a, s) => a + (s.verified ? 4 : 0) + s.rating, 0);
    const score = Math.min(100, Math.round(occurrences * 22 + quality * 1.5));
    return { axis, score, skillIds: contributors.map((s) => s.id) };
  });
}

/** Skill DNA 하단의 자연어 분석 문장 (§17) */
export function analyzeDna(dna: DnaScore[], catalog: Skill[], equippedIds: string[]) {
  const sorted = [...dna].sort((a, b) => b.score - a.score);
  const strong = sorted[0];
  const weak = sorted[sorted.length - 1];
  const AXIS_KO: Record<Axis, string> = {
    FIND: "금융기회를 찾는",
    UNDERSTAND: "금융정보를 이해하는",
    MANAGE: "금융생활을 관리하는",
    PROTECT: "금융생활을 보호하는",
  };
  const equipped = new Set(equippedIds);
  const suggestion = catalog
    .filter((s) => !equipped.has(s.id))
    .find((s) => s.type.some((t) => TYPE_TO_AXIS[t] === weak.axis));

  const text =
    strong.score === 0
      ? "아직 장착된 Skill 이 없습니다. FinKit 을 설치하면 Agent 의 금융 능력이 생깁니다."
      : `현재 Agent 는 ${AXIS_KO[strong.axis]} 능력은 강하지만(${strong.score}점), ${AXIS_KO[weak.axis]} 능력이 부족합니다(${weak.score}점).`;

  return { text, suggestion, strong, weak };
}
