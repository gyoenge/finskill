/**
 * 데모 시드 — 설계 문서 §73 Demo Scenario 의 사용자.
 *
 * 25세 대학 졸업 예정자. 온보딩을 아직 하지 않은 방문자에게도
 * Timeline 이 어떻게 보이는지 즉시 보여주기 위한 예시 데이터다.
 */

import type { LifeEvent, User } from "./timeline";
import { statusForDate } from "./timeline";
import { generateAllFinEvents } from "./fin-events";
import type { TimelineState } from "./state";

const USER_ID = "demo";

export const DEMO_USER: User = {
  id: USER_ID,
  birthYear: 2001, // 2026 기준 만 25세
  currentStatus: "job_seeker",
  region: "서울",
  livingType: "family",
};

/** 설계 §73 의 5개 Life Event */
function demoLifeEvents(now = new Date()): LifeEvent[] {
  const raw: Array<Omit<LifeEvent, "status">> = [
    { id: "le_enroll", userId: USER_ID, type: "education", subtype: "enroll", title: "대학 입학", date: "2023-03", certainty: "confirmed", source: "user" },
    { id: "le_loan", userId: USER_ID, type: "finance", subtype: "student-loan", title: "학자금대출", date: "2024-03", certainty: "confirmed", source: "user" },
    { id: "le_graduate", userId: USER_ID, type: "education", subtype: "graduate", title: "졸업", date: "2027-02", certainty: "confirmed", source: "user" },
    { id: "le_employ", userId: USER_ID, type: "career", subtype: "employ", title: "취업", date: "2027-08", certainty: "expected", source: "user" },
    { id: "le_independence", userId: USER_ID, type: "living", subtype: "independence", title: "독립", date: "2028-03", certainty: "goal", source: "user" },
  ];
  return raw.map((e) => ({ ...e, status: statusForDate(e.date, now) }));
}

/** 온보딩 미완료 방문자에게 보여줄 데모 상태 전체 */
export function demoState(now = new Date()): TimelineState {
  const lifeEvents = demoLifeEvents(now);
  return {
    user: DEMO_USER,
    lifeEvents,
    finEvents: generateAllFinEvents(lifeEvents, now),
    financialContext: {
      userId: USER_ID,
      debts: [{ type: "학자금대출", amount: 8_000_000 }],
    },
    chats: {},
    isDemo: true,
  };
}
