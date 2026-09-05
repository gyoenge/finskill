/**
 * 20FIN 도메인 모델
 *
 * 설계 문서(docs/design-spec.md) §7·§9 의 데이터 모델을 구현한다.
 * 핵심 흐름: Life Event → Fin Event → Right Timing → Financial Action.
 *
 * 청년정책·LH·장학금 같은 기존 데이터 소스는 Backend Tool 로만 재사용하고(설계 §36),
 * 사용자에게 노출되는 도메인은 이 파일의 Timeline 모델이 담당한다.
 */

/** 현재 상태 (온보딩 Step 1) */
export type UserStatus = "student" | "job_seeker" | "employee" | "freelancer" | "other";

/** 현재 거주 형태 */
export type LivingType = "family" | "dorm" | "alone" | "other";

export interface User {
  id: string;
  birthYear: number;
  currentStatus: UserStatus;
  region?: string;
  livingType?: LivingType;
}

/** Life Event 대분류 (설계 §9) */
export type LifeEventType = "education" | "career" | "living" | "finance" | "goal";

/** 미래 일정의 확실성 (설계 §10) */
export type Certainty = "confirmed" | "expected" | "goal";

/** 현재 시점 기준 과거/현재/미래 */
export type EventStatus = "past" | "current" | "future";

export interface LifeEvent {
  id: string;
  userId: string;
  type: LifeEventType;
  /** 세부 종류 키 (LIFE_EVENT_CATALOG 의 subtype) */
  subtype: string;
  title: string;
  /** YYYY-MM 또는 YYYY-MM-DD. 미정이면 undefined */
  date?: string;
  certainty: Certainty;
  source: "user";
  status: EventStatus;
}

/** Fin Event 종류 (설계 §45) */
export type FinEventType = "check" | "deadline" | "opportunity" | "planning" | "risk";

export type Priority = "low" | "medium" | "high";

export type FinEventStatus = "pending" | "completed" | "dismissed";

export interface FinEvent {
  id: string;
  userId: string;
  /** 어떤 Life Event 때문에 생성됐는지 */
  lifeEventId?: string;
  title: string;
  type: FinEventType;
  /** YYYY-MM-DD */
  dueDate?: string;
  priority: Priority;
  status: FinEventStatus;
  /** 규칙 기반 생성 vs Agent 생성 (설계 §40) */
  generatedBy: "rule" | "agent";
  /** Right Now / Event Detail 에 보여줄 한 줄 설명 */
  note?: string;
}

/** 금융 프로필 — Progressive Profiling 으로 필요할 때만 채운다 (설계 §46) */
export interface FinancialContext {
  userId: string;
  monthlyIncome?: number;
  monthlyExpense?: number;
  savings?: number;
  debts?: { type: string; amount?: number; interestRate?: number }[];
  emergencyFund?: number;
}

/** 청년정책·주거지원 등 외부 기회 (설계 §47) */
export interface Opportunity {
  id: string;
  title: string;
  provider: string;
  category: "housing" | "employment" | "asset" | "education" | "finance";
  /** 매칭 근거 계산용 조건 (나이/지역/상태 등) */
  eligibility: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
  officialUrl?: string;
  updatedAt: string;
  /** "왜 추천했나요?" 에 노출할 매칭 근거 */
  reasons?: string[];
}

/** Life Event 별 준비도 (설계 §48·§23) */
export interface EventReadiness {
  lifeEventId: string;
  overallScore: number;
  dimensions: { key: string; label: string; score: number }[];
  nextAction?: string;
}

/* ------------------------------------------------------------------ */
/* Life Event 카탈로그 — 온보딩에서 선택 가능한 종류 (설계 §9)          */
/* ------------------------------------------------------------------ */

export interface LifeEventOption {
  subtype: string;
  title: string;
  type: LifeEventType;
}

export const LIFE_EVENT_CATALOG: Record<LifeEventType, { label: string; icon: string; options: LifeEventOption[] }> = {
  education: {
    label: "Education",
    icon: "graduation",
    options: [
      { subtype: "enroll", title: "대학 입학", type: "education" },
      { subtype: "leave", title: "휴학", type: "education" },
      { subtype: "return", title: "복학", type: "education" },
      { subtype: "graduate", title: "졸업", type: "education" },
      { subtype: "grad-school", title: "대학원", type: "education" },
      { subtype: "certificate", title: "자격증", type: "education" },
      { subtype: "study-abroad", title: "유학", type: "education" },
    ],
  },
  career: {
    label: "Career",
    icon: "briefcase",
    options: [
      { subtype: "part-time", title: "아르바이트", type: "career" },
      { subtype: "intern", title: "인턴", type: "career" },
      { subtype: "employ", title: "취업", type: "career" },
      { subtype: "job-change", title: "이직", type: "career" },
      { subtype: "resign", title: "퇴사", type: "career" },
      { subtype: "freelance", title: "프리랜스", type: "career" },
      { subtype: "startup", title: "창업", type: "career" },
    ],
  },
  living: {
    label: "Living",
    icon: "home",
    options: [
      { subtype: "independence", title: "독립", type: "living" },
      { subtype: "live-alone", title: "자취", type: "living" },
      { subtype: "move", title: "이사", type: "living" },
      { subtype: "jeonse", title: "전세", type: "living" },
      { subtype: "monthly-rent", title: "월세", type: "living" },
      { subtype: "dorm", title: "기숙사", type: "living" },
      { subtype: "abroad", title: "해외 거주", type: "living" },
    ],
  },
  finance: {
    label: "Money",
    icon: "card",
    options: [
      { subtype: "first-salary", title: "첫 월급", type: "finance" },
      { subtype: "student-loan", title: "학자금대출", type: "finance" },
      { subtype: "first-card", title: "첫 신용카드", type: "finance" },
      { subtype: "loan", title: "대출", type: "finance" },
      { subtype: "start-saving", title: "저축 시작", type: "finance" },
      { subtype: "start-invest", title: "투자 시작", type: "finance" },
    ],
  },
  goal: {
    label: "Goal",
    icon: "target",
    options: [
      { subtype: "lump-sum", title: "목돈 만들기", type: "goal" },
      { subtype: "independence-fund", title: "독립자금", type: "goal" },
      { subtype: "study-abroad-goal", title: "유학", type: "goal" },
      { subtype: "travel", title: "여행", type: "goal" },
      { subtype: "car", title: "자동차", type: "goal" },
      { subtype: "other", title: "기타 목표", type: "goal" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* 날짜 유틸                                                           */
/* ------------------------------------------------------------------ */

/** "YYYY" · "YYYY-MM" · "YYYY-MM-DD" 를 Date 로. 월이 없으면 1월로 본다. 실패 시 null */
export function parseEventDate(date?: string): Date | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map((n) => parseInt(n, 10));
  if (!y) return null;
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Timeline·카드에 표시할 라벨: "YYYY.MM" · "YYYY" · "미정" */
export function formatEventDate(date?: string): string {
  if (!date) return "미정";
  const [y, m] = date.split("-").map((n) => parseInt(n, 10));
  if (!y) return "미정";
  return m ? `${y}.${String(m).padStart(2, "0")}` : `${y}`;
}

/** 오늘 기준으로 과거/현재/미래 판정 (같은 달이면 current) */
export function statusForDate(date: string | undefined, now = new Date()): EventStatus {
  const dt = parseEventDate(date);
  if (!dt) return "future";
  const nowMonth = now.getFullYear() * 12 + now.getMonth();
  const dtMonth = dt.getFullYear() * 12 + dt.getMonth();
  if (dtMonth < nowMonth) return "past";
  if (dtMonth === nowMonth) return "current";
  return "future";
}

/** D-day (양수 = 남은 일수, 음수 = 지난 일수). 날짜 없으면 null */
export function daysUntil(date: string | undefined, now = new Date()): number | null {
  const dt = parseEventDate(date);
  if (!dt) return null;
  const ms = dt.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round(ms / 86_400_000);
}
