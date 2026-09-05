/**
 * 20FIN 사용자 상태와 순수 상태전이 함수.
 *
 * FinSkill 과 동일하게 서버는 무상태로 두고 상태는 브라우저 localStorage 에 둔다.
 * (StoreProvider 주석 참고 — Vercel 서버리스는 파일시스템이 읽기 전용)
 * 나중에 Supabase 로 옮기려면 TimelineStore 프로바이더만 교체하면 된다.
 */

import type {
  FinancialContext,
  FinEvent,
  FinEventStatus,
  LifeEvent,
  User,
} from "./timeline";
import { statusForDate } from "./timeline";
import { generateFinEvents } from "./fin-events";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  /** 이 답변에 연결된 Life Event (Event → AI 연결, 설계 §26) */
  lifeEventId?: string;
  sources?: string[];
  createdAt: string;
}

export interface TimelineState {
  user: User | null;
  lifeEvents: LifeEvent[];
  finEvents: FinEvent[];
  financialContext: FinancialContext | null;
  chats: Record<string, ChatMessage[]>;
  /** 데모 시드로 채워진 상태인지 (온보딩 미완료) */
  isDemo?: boolean;
}

export const EMPTY_STATE: TimelineState = {
  user: null,
  lifeEvents: [],
  finEvents: [],
  financialContext: null,
  chats: {},
};

let seq = 0;
function id(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}`;
}

/** 만 나이 → 출생연도 */
export function birthYearFromAge(age: number, now = new Date()): number {
  return now.getFullYear() - age;
}

/** 온보딩 시 입력한 Life Event 초안 (id/status 없이) */
export type LifeEventDraft = Omit<LifeEvent, "id" | "userId" | "status" | "source">;

/**
 * 온보딩 완료 — User 와 Life Event 목록으로 상태를 새로 구성한다 (설계 §7·§12).
 * 각 Life Event 에 대해 Fin Event 를 즉시 생성한다("앞으로의 20FIN을 준비했어요").
 */
export function initFromOnboarding(
  user: User,
  drafts: LifeEventDraft[],
  now = new Date(),
): TimelineState {
  let next: TimelineState = { ...EMPTY_STATE, user: { ...user }, chats: {}, isDemo: false };
  for (const draft of drafts) {
    next = addLifeEvent(next, draft, now);
  }
  return next;
}

/** 모든 Life Event 의 과거/현재/미래 상태를 오늘 기준으로 다시 계산 */
export function recomputeStatuses(state: TimelineState, now = new Date()): TimelineState {
  return {
    ...state,
    lifeEvents: state.lifeEvents.map((e) => ({ ...e, status: statusForDate(e.date, now) })),
  };
}

/* --------------------------- Life Event CRUD --------------------------- */

export function addLifeEvent(
  state: TimelineState,
  input: Omit<LifeEvent, "id" | "userId" | "status" | "source">,
  now = new Date(),
): TimelineState {
  const userId = state.user?.id ?? "me";
  const lifeEvent: LifeEvent = {
    ...input,
    id: id("le"),
    userId,
    source: "user",
    status: statusForDate(input.date, now),
  };
  return {
    ...state,
    lifeEvents: [...state.lifeEvents, lifeEvent],
    // 새 Life Event 에 대한 Fin Event 를 즉시 생성한다 (설계 §12 Aha Moment)
    finEvents: [...state.finEvents, ...generateFinEvents(lifeEvent, now)],
  };
}

export function updateLifeEvent(
  state: TimelineState,
  eventId: string,
  patch: Partial<LifeEvent>,
  now = new Date(),
): TimelineState {
  return {
    ...state,
    lifeEvents: state.lifeEvents.map((e) =>
      e.id === eventId ? { ...e, ...patch, status: statusForDate(patch.date ?? e.date, now) } : e,
    ),
  };
}

export function removeLifeEvent(state: TimelineState, eventId: string): TimelineState {
  return {
    ...state,
    lifeEvents: state.lifeEvents.filter((e) => e.id !== eventId),
    // 이 Life Event 로 생성된 Fin Event 도 함께 제거
    finEvents: state.finEvents.filter((f) => f.lifeEventId !== eventId),
  };
}

/* ---------------------------- Fin Event ------------------------------- */

export function setFinEventStatus(
  state: TimelineState,
  finEventId: string,
  status: FinEventStatus,
): TimelineState {
  return {
    ...state,
    finEvents: state.finEvents.map((f) => (f.id === finEventId ? { ...f, status } : f)),
  };
}

/** 모든 Life Event 로부터 Fin Event 를 다시 생성 (온보딩 완료 시) */
export function regenerateFinEvents(state: TimelineState, now = new Date()): TimelineState {
  const rule = state.lifeEvents.flatMap((le) => generateFinEvents(le, now));
  // Agent 가 만든 Fin Event 는 보존하고 규칙 기반만 교체한다.
  const agentMade = state.finEvents.filter((f) => f.generatedBy === "agent");
  return { ...state, finEvents: [...rule, ...agentMade] };
}
