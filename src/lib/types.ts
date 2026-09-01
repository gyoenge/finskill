/**
 * FinSkill 도메인 타입
 *
 * README §22 (Skill Manifest), §26 (데이터 구조) 를 그대로 옮긴 표준 포맷이다.
 * 모든 Skill 은 실행방식(API / RAG / Calculator)과 무관하게 이 형태를 공유한다.
 */

/** README §6.1 금융 분야 Category */
export type Category =
  | "wealth" // 자산형성
  | "saving" // 저축
  | "invest" // 투자
  | "credit" // 대출/신용
  | "spending" // 소비
  | "housing" // 주거
  | "education" // 교육/장학
  | "youth" // 청년정책
  | "security" // 금융보안
  | "literacy"; // 금융상식

/** README §6.3 세부 기능 Type */
export type SkillType =
  | "search"
  | "match"
  | "compare"
  | "explain"
  | "calculate"
  | "analyze"
  | "plan"
  | "protect"
  | "action";

/** README §6.2 기능 대분류 — Skill DNA 의 4개 축이기도 하다 (§17) */
export type Axis = "FIND" | "UNDERSTAND" | "MANAGE" | "PROTECT";

/** README §23 Skill Trust Layer */
export type RiskLevel = "low" | "medium" | "high";

/** README §20 Skill 실행 방식 */
export type ExecutorType = "http" | "rag" | "calculator";

export type PersonaId = "university" | "firstjob" | "living-alone" | "beginner";

export interface SkillPermissions {
  /** 외부 통신이 허용된 도메인. 빈 배열이면 외부통신 없음 */
  network: string[];
  /** 개인 금융/신상 데이터 접근 여부 */
  personalData: boolean;
  /** 사용자 데이터를 수정하는 쓰기 동작 여부 */
  writeAction: boolean;
  /** 실제 금융거래(송금/주문/신청) 수행 여부 — MVP 는 항상 false (§23) */
  financialTransaction: boolean;
}

export interface SkillInput {
  key: string;
  label: string;
  /** UI 렌더링 및 Skill Executor 의 입력 파싱에 사용 */
  kind: "text" | "number" | "select" | "region" | "money";
  required: boolean;
  placeholder?: string;
  options?: string[];
  unit?: string;
}

/** README §16 Skill Passport 에 표시되는 정보 */
export interface SkillPassport {
  canDo: string[];
  cannotDo: string[];
  /** 위험도 판정 근거 */
  riskReason: string;
  lastUpdated: string; // YYYY.MM.DD
}

export interface Skill {
  id: string;
  name: string;
  version: string;
  /** 이모지 아이콘 — 퍼즐 조각 카드에 표시 */
  icon: string;
  tagline: string;
  description: string;
  category: Category[];
  type: SkillType[];
  provider: string;
  dataSources: string[];
  permissions: SkillPermissions;
  risk: RiskLevel;
  executor: {
    type: ExecutorType;
    /** src/lib/agent/executor.ts 의 핸들러 키 */
    ref: string;
  };
  passport: SkillPassport;
  inputs: SkillInput[];
  examples: string[];
  /** Fallback Router 및 Skill Gap 탐지에 쓰이는 트리거 키워드 */
  keywords: string[];
  personas: PersonaId[];
  rating: number;
  installCount: number;
  verified: boolean;
  createdAt: string;
  /** 사용자가 Skill Builder 로 직접 만든 Skill (§21) */
  custom?: boolean;
  /** 신규 배지 노출용 */
  isNew?: boolean;
}

/** README §8 FinKit — Persona/목적별 Skill 묶음 */
export interface FinKit {
  id: string;
  name: string;
  persona: PersonaId;
  icon: string;
  tagline: string;
  /** 이 묶음을 추천하는 이유 (§9) */
  reason: string;
  skillIds: string[];
}

export interface PersonaProfile {
  id: PersonaId;
  name: string;
  icon: string;
  summary: string;
  /** 온보딩 답변 → Persona 매칭 규칙 (MVP 는 규칙 기반, §9) */
  match: {
    status?: string[];
    housing?: string[];
    knowledge?: string[];
    interests?: Category[];
  };
  defaultAgentName: string;
  defaultInstructions: string;
}

/** README §15 Skill Recipe */
export interface Recipe {
  id: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  steps: { skillId: string; note: string }[];
}

/** README §9 온보딩 입력 */
export interface OnboardingProfile {
  age: string;
  status: string;
  region: string;
  housing: string;
  interests: Category[];
  knowledge: string;
}

/** README §26 user_skills */
export interface InstalledSkill {
  skillId: string;
  version: string;
  enabled: boolean;
  installedAt: string;
}

/** README §26 agents + agent_skills */
export interface Agent {
  id: string;
  name: string;
  persona: string;
  instructions: string;
  model: string;
  skillIds: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  /** README §19 Skill Trace */
  trace?: TraceStep[];
  /** README §14 Skill Gap */
  gap?: SkillGap;
  sources?: string[];
  createdAt: string;
}

export interface TraceStep {
  skillId: string;
  skillName: string;
  icon: string;
  executor: ExecutorType;
  /** "12개 결과", "3개 후보" 같은 한 줄 요약 */
  summary: string;
  sources: string[];
  /** Skill 이 반환한 구조화 결과 — UI 카드 렌더링에 사용 */
  data?: unknown;
  ms: number;
}

export interface SkillGap {
  /** 요청을 완전히 해결하는 데 추가로 필요한 Skill */
  missing: { skillId: string; name: string; icon: string; reason: string }[];
  message: string;
}

export interface UserState {
  profile: OnboardingProfile | null;
  personaId: PersonaId | null;
  installed: InstalledSkill[];
  agents: Agent[];
  activeAgentId: string | null;
  customSkills: Skill[];
  chats: Record<string, ChatMessage[]>;
  recentSkillIds: string[];
}
