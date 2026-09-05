/**
 * Opportunity 개인화 랭킹 (설계 문서 §54).
 *
 *   Score = Fit × Timing × Actionability
 *
 * - Fit          : 나이·지역·Life Event 와 얼마나 맞는가
 * - Timing       : 지금 필요한가 (마감 임박도)
 * - Actionability: 지금 실제 행동 가능한가 (신청 URL·모집 진행 중)
 *
 * 매칭 근거(reasons)는 "왜 추천했나요?"(설계 §29)에 그대로 노출한다.
 */

import type { LivingType, Opportunity, UserStatus } from "./timeline";
import { daysUntil } from "./timeline";

export interface UserCtx {
  age: number | null;
  region?: string;
  currentStatus?: UserStatus;
  livingType?: LivingType;
  /** 사용자 Life Event 의 subtype 집합 (career/living/education 매칭용) */
  lifeSubtypes: string[];
  /** 미래 Life Event 종류 — 관련성 가중 */
  futureTypes: string[];
}

export interface RankedOpportunity {
  opp: Opportunity;
  score: number;
  reasons: string[];
  /** 마감까지 남은 일수 (없으면 null) */
  dday: number | null;
}

/** category ↔ Life Event type 관련성 */
const CATEGORY_TO_LIFE: Record<string, string[]> = {
  housing: ["living"],
  employment: ["career"],
  education: ["education"],
  asset: ["finance", "goal"],
  finance: ["finance", "goal"],
};

const STATUS_TO_CATEGORY: Partial<Record<UserStatus, string[]>> = {
  student: ["education", "finance"],
  job_seeker: ["employment", "finance"],
  employee: ["asset", "finance"],
  freelancer: ["employment", "asset", "finance"],
};

const STATUS_REASON: Partial<Record<UserStatus, string>> = {
  student: "대학생인 현재 상태와 관련",
  job_seeker: "취업 준비 중인 현재 상태와 관련",
  employee: "직장 생활 중인 현재 상태와 관련",
  freelancer: "프리랜서인 현재 상태와 관련",
};

/* --- 지역 판별 -----------------------------------------------------------
   공고 텍스트가 특정 광역 지자체에 한정되는지 판별해, 다른 지역 전용 공고가
   나이·마감 점수만으로 상위 노출되는 문제를 막는다. */

const REGION_ALIASES: [string, string[]][] = [
  ["서울", ["서울"]],
  ["부산", ["부산"]],
  ["대구", ["대구"]],
  ["인천", ["인천"]],
  ["광주", ["광주"]],
  ["대전", ["대전"]],
  ["울산", ["울산"]],
  ["세종", ["세종"]],
  ["경기", ["경기"]],
  ["강원", ["강원"]],
  ["충북", ["충북", "충청북"]],
  ["충남", ["충남", "충청남"]],
  ["전북", ["전북", "전라북"]],
  ["전남", ["전남", "전라남"]],
  ["경북", ["경북", "경상북"]],
  ["경남", ["경남", "경상남"]],
  ["제주", ["제주"]],
];
const NATIONWIDE = /전국|전국단위|해당없음|제한없음|누구나|상관없음/;

function regionsMentioned(text: string): Set<string> {
  const found = new Set<string>();
  for (const [key, aliases] of REGION_ALIASES) if (aliases.some((a) => text.includes(a))) found.add(key);
  return found;
}

function userRegionKey(region?: string): string | null {
  if (!region) return null;
  for (const [key, aliases] of REGION_ALIASES) if (aliases.some((a) => region.includes(a))) return key;
  return null;
}

type RegionRelation = "local" | "nationwide" | "foreign";

/** 사용자 지역 대비 공고의 지역 성격 (local=내 지역, foreign=타지역 한정) */
function regionRelation(regionText: string | undefined, userKey: string | null): RegionRelation {
  if (!regionText || NATIONWIDE.test(regionText)) return "nationwide";
  const mentioned = regionsMentioned(regionText);
  if (mentioned.size === 0) return "nationwide"; // 특정 지역 언급 없음 → 전국성으로 간주
  if (!userKey) return "nationwide"; // 사용자 지역을 모르면 지역 필터 불가
  return mentioned.has(userKey) ? "local" : "foreign";
}

function fitScore(opp: Opportunity, ctx: UserCtx, reasons: string[], rel: RegionRelation): number {
  let fit = 0.5; // 기본
  const elig = opp.eligibility as { minAge?: number | null; maxAge?: number | null; regionText?: string };

  // 나이
  if (ctx.age !== null && (elig.minAge || elig.maxAge)) {
    const okMin = !elig.minAge || ctx.age >= elig.minAge;
    const okMax = !elig.maxAge || ctx.age <= elig.maxAge;
    if (okMin && okMax) {
      fit += 0.25;
      reasons.push(`만 ${ctx.age}세 대상`);
    } else {
      fit -= 0.35; // 나이 조건 벗어나면 강한 감점
    }
  }

  // 지역 — local 은 가점, foreign 은 강한 감점(추가로 랭킹에서 제외됨)
  if (rel === "local" && ctx.region) {
    fit += 0.2;
    reasons.push(`${ctx.region} 거주 관련`);
  } else if (rel === "nationwide") {
    fit += 0.05;
  } else if (rel === "foreign") {
    fit -= 0.5;
  }

  // 현재 상태와 거주 형태도 기본정보의 일부로 직접 반영한다.
  if (ctx.currentStatus && STATUS_TO_CATEGORY[ctx.currentStatus]?.includes(opp.category)) {
    fit += 0.15;
    const reason = STATUS_REASON[ctx.currentStatus];
    if (reason) reasons.push(reason);
  }
  if (opp.category === "housing" && (ctx.livingType === "family" || ctx.livingType === "dorm")) {
    fit += 0.1;
    reasons.push(ctx.livingType === "family" ? "본가에서 독립 준비에 참고" : "기숙사 이후 주거 준비에 참고");
  }

  // Life Event 관련성
  const relatedLife = CATEGORY_TO_LIFE[opp.category] ?? [];
  if (relatedLife.some((t) => ctx.futureTypes.includes(t))) {
    fit += 0.25;
    const labelMap: Record<string, string> = { living: "독립", career: "취업", education: "학업", finance: "자산형성", goal: "목표" };
    const hit = relatedLife.find((t) => ctx.futureTypes.includes(t));
    if (hit) reasons.push(`${labelMap[hit] ?? "계획"} 목표와 관련`);
  }


  // 공고 텍스트에 구체적인 이벤트명이 있으면 대분류 매칭보다 강한 근거로 쓴다.
  const searchText = `${opp.title} ${elig.regionText ?? ""} ${(elig as { summary?: string }).summary ?? ""}`.toLowerCase();
  const matchingSubtype = ctx.lifeSubtypes.find((subtype) => {
    const keywords: Record<string, string[]> = {
      graduate: ["졸업"], employ: ["취업", "구직"], intern: ["인턴"], independence: ["독립", "청년주택", "주거"],
      "student-loan": ["학자금", "대출"], "start-saving": ["저축", "자산형성"], "lump-sum": ["목돈", "자산형성"],
    };
    return (keywords[subtype] ?? []).some((keyword) => searchText.includes(keyword));
  });
  if (matchingSubtype) {
    fit += 0.15;
    reasons.push("타임라인의 구체적인 계획과 관련");
  }

  return Math.max(0, Math.min(1, fit));
}

function timingScore(dday: number | null, reasons: string[]): number {
  if (dday === null) return 0.55; // 마감 정보 없음 — 중립
  if (dday < 0) return 0.05; // 이미 마감
  if (dday <= 14) {
    reasons.push(`신청 마감 임박 (D-${dday})`);
    return 1;
  }
  if (dday <= 30) return 0.85;
  if (dday <= 60) return 0.7;
  return 0.55;
}

function actionabilityScore(opp: Opportunity, dday: number | null): number {
  let a = 0.4;
  if (opp.officialUrl) a += 0.3; // 신청 경로 존재
  if (dday === null || dday >= 0) a += 0.3; // 모집 진행 중(또는 상시)
  return Math.min(1, a);
}

export function rankOpportunities(opps: Opportunity[], ctx: UserCtx): RankedOpportunity[] {
  const userKey = userRegionKey(ctx.region);
  return opps
    .map((opp) => {
      const reasons: string[] = [];
      const dday = daysUntil(opp.endDate);
      const rel = regionRelation((opp.eligibility as { regionText?: string }).regionText, userKey);
      const fit = fitScore(opp, ctx, reasons, rel);
      const timing = timingScore(dday, reasons);
      const action = actionabilityScore(opp, dday);
      const score = fit * timing * action;
      return { opp, score, reasons, dday, rel };
    })
    // 타지역 한정 공고, 이미 마감된 것, 적합도가 매우 낮은 것은 제외한다.
    .filter((r) => r.rel !== "foreign" && r.score > 0.08 && (r.dday === null || r.dday >= 0))
    .sort((a, b) => b.score - a.score)
    .map(({ rel: _rel, ...r }) => r);
}
