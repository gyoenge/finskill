/**
 * Timeline 상태에서 화면이 필요로 하는 것만 골라내는 파생 함수들.
 * "100개가 있어도 홈에서는 1~3개만" — 정보 Filtering 이 핵심 가치다 (설계 §5.4).
 */

import type { FinEvent, LifeEvent } from "./timeline";
import { daysUntil, parseEventDate } from "./timeline";
import type { TimelineState } from "./state";

/** 만 나이 */
export function ageOf(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

const STATUS_LABEL: Record<string, string> = {
  student: "대학생",
  job_seeker: "취업 준비 중",
  employee: "직장인",
  freelancer: "프리랜서",
  other: "",
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? "";
}

/** 우선순위 가중치 (high > medium > low) */
const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

/**
 * "지금, 이것만 챙기세요" — 아직 유효한 Fin Event 를 임박도·우선순위로 정렬해 상위 N개.
 * 이미 지난 것과 완료/무시된 것은 제외한다.
 */
export function rightNowFinEvents(state: TimelineState, limit = 3, now = new Date()): FinEvent[] {
  return state.finEvents
    .filter((f) => f.status === "pending")
    .map((f) => ({ f, d: daysUntil(f.dueDate, now) }))
    // 마감이 60일 이상 지난 것은 노출하지 않는다 (아직 다가오는 것 우선)
    .filter(({ d }) => d === null || d >= -14)
    .sort((a, b) => {
      const pa = PRIORITY_WEIGHT[a.f.priority] ?? 0;
      const pb = PRIORITY_WEIGHT[b.f.priority] ?? 0;
      // 임박(작은 d) + 높은 우선순위를 앞으로
      const sa = (a.d ?? 9999) - pa * 20;
      const sb = (b.d ?? 9999) - pb * 20;
      return sa - sb;
    })
    .slice(0, limit)
    .map(({ f }) => f);
}

/** "곧 다가와요" — 가장 가까운 마감(deadline/check) 하나 */
export function nearestDeadline(state: TimelineState, now = new Date()): FinEvent | null {
  const upcoming = state.finEvents
    .filter((f) => f.status === "pending" && f.dueDate)
    .map((f) => ({ f, d: daysUntil(f.dueDate, now) }))
    .filter(({ d }) => d !== null && d >= 0)
    .sort((a, b) => (a.d ?? 0) - (b.d ?? 0));
  return upcoming[0]?.f ?? null;
}

/** 다가오는 미래 Life Event N개 (준비도 계산 전이므로 날짜순) */
export function upcomingLifeEvents(state: TimelineState, limit = 3, now = new Date()): LifeEvent[] {
  return state.lifeEvents
    .filter((e) => e.status === "future")
    .sort((a, b) => {
      const da = parseEventDate(a.date)?.getTime() ?? Infinity;
      const db = parseEventDate(b.date)?.getTime() ?? Infinity;
      return da - db;
    })
    .slice(0, limit);
}

/** Timeline 정렬용 — 모든 Life Event 를 날짜 오름차순 */
export function sortedLifeEvents(state: TimelineState): LifeEvent[] {
  return [...state.lifeEvents].sort((a, b) => {
    const da = parseEventDate(a.date)?.getTime() ?? Infinity;
    const db = parseEventDate(b.date)?.getTime() ?? Infinity;
    return da - db;
  });
}
