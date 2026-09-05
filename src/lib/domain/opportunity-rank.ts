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

import type { Opportunity } from "./timeline";
import { daysUntil } from "./timeline";

export interface UserCtx {
  age: number | null;
  region?: string;
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

function fitScore(opp: Opportunity, ctx: UserCtx, reasons: string[]): number {
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

  // 지역
  if (ctx.region && elig.regionText) {
    if (elig.regionText.includes(ctx.region)) {
      fit += 0.2;
      reasons.push(`${ctx.region} 거주 관련`);
    } else if (/전국|해당없음|제한없음/.test(elig.regionText)) {
      fit += 0.05;
    }
  }

  // Life Event 관련성
  const relatedLife = CATEGORY_TO_LIFE[opp.category] ?? [];
  if (relatedLife.some((t) => ctx.futureTypes.includes(t))) {
    fit += 0.25;
    const labelMap: Record<string, string> = { living: "독립", career: "취업", education: "학업", finance: "자산형성", goal: "목표" };
    const hit = relatedLife.find((t) => ctx.futureTypes.includes(t));
    if (hit) reasons.push(`${labelMap[hit] ?? "계획"} 목표와 관련`);
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
  return opps
    .map((opp) => {
      const reasons: string[] = [];
      const dday = daysUntil(opp.endDate);
      const fit = fitScore(opp, ctx, reasons);
      const timing = timingScore(dday, reasons);
      const action = actionabilityScore(opp, dday);
      const score = fit * timing * action;
      return { opp, score, reasons, dday };
    })
    // 이미 마감됐거나 적합도가 매우 낮은 것은 제외한다.
    .filter((r) => r.score > 0.08 && (r.dday === null || r.dday >= 0))
    .sort((a, b) => b.score - a.score);
}
