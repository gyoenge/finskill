/**
 * Fin Event 생성기 (설계 문서 §42·§70)
 *
 * Life Event 를 입력받아 규칙 기반으로 금융 체크포인트(Fin Event)를 만든다.
 * "언제 무엇을 준비해야 하는가" 를 Timeline 위에 자동 배치하는 것이 핵심.
 *
 * 설계 §40 원칙: 시점 계산은 LLM 이 아니라 이 규칙 엔진이 담당한다.
 * Agent 는 이후 이 Template 을 사용자 Context 에 맞게 미세 조정할 수 있다.
 */

import type { FinEvent, FinEventType, LifeEvent, Priority } from "./timeline";
import { parseEventDate } from "./timeline";

interface FinEventTemplate {
  /** 기준 Life Event 로부터의 개월 offset (음수 = 이전, 양수 = 이후) */
  offsetMonths: number;
  title: string;
  type: FinEventType;
  priority: Priority;
  note?: string;
}

/**
 * subtype 별 Fin Event Template.
 * MVP 대표 Life Event 3종(졸업/첫 취업/독립)을 우선 채운다 (설계 §71).
 */
const TEMPLATES: Record<string, FinEventTemplate[]> = {
  // 독립 (설계 §42)
  independence: [
    { offsetMonths: -12, title: "독립 필요자금 추정", type: "planning", priority: "medium", note: "보증금·이사비·초기 생활비를 대략 계산해봐요." },
    { offsetMonths: -9, title: "목표 저축 계산", type: "planning", priority: "medium", note: "목표 시점까지 매달 얼마를 모아야 하는지 확인해요." },
    { offsetMonths: -6, title: "주거지원 확인", type: "opportunity", priority: "high", note: "청년 월세지원·전세대출 등 받을 수 있는 지원을 먼저 챙겨요." },
    { offsetMonths: -3, title: "집 탐색 시작", type: "check", priority: "medium" },
    { offsetMonths: -2, title: "전세·월세 대출 확인", type: "check", priority: "medium" },
    { offsetMonths: -1, title: "계약 전 금융 체크", type: "risk", priority: "high", note: "등기·보증금 보호·특약을 계약 전에 점검해요." },
    { offsetMonths: 1, title: "독립 후 현금흐름 재설계", type: "planning", priority: "medium" },
  ],
  "independence-fund": [
    { offsetMonths: -9, title: "독립자금 목표 설정", type: "planning", priority: "medium" },
    { offsetMonths: -6, title: "청년 자산형성 상품 확인", type: "opportunity", priority: "high" },
  ],

  // 졸업 (설계 §35 졸업 FinKit)
  graduate: [
    { offsetMonths: -3, title: "학자금 상태 점검", type: "check", priority: "high", note: "졸업 후 상환이 시작되기 전에 잔액과 거치기간을 확인해요." },
    { offsetMonths: -1, title: "졸업 이후 생활비 계획", type: "planning", priority: "medium" },
    { offsetMonths: 1, title: "취업지원 확인", type: "opportunity", priority: "high", note: "구직 기간에 받을 수 있는 청년 구직지원을 확인해요." },
  ],

  // 취업 / 첫 월급 (설계 §35 첫 월급 FinKit)
  employ: [
    { offsetMonths: 0, title: "실수령액 점검", type: "check", priority: "medium", note: "세전과 실수령액 차이를 확인해요." },
    { offsetMonths: 1, title: "첫 월급 관리 시작", type: "planning", priority: "high", note: "고정비·비상금·저축 비율을 먼저 정해요." },
    { offsetMonths: 2, title: "비상금 목표 설정", type: "planning", priority: "medium" },
    { offsetMonths: 3, title: "청년 자산형성 확인", type: "opportunity", priority: "high", note: "청년도약계좌 등 받을 수 있는 지원을 확인해요." },
  ],
  "first-salary": [
    { offsetMonths: 0, title: "월급 배분 계획", type: "planning", priority: "high" },
    { offsetMonths: 1, title: "비상금 목표 설정", type: "planning", priority: "medium" },
  ],

  // 학자금대출
  "student-loan": [
    { offsetMonths: 0, title: "학자금 상태 점검", type: "check", priority: "medium", note: "대출 잔액·금리·상환 시작일을 확인해요." },
    { offsetMonths: 6, title: "상환 계획 세우기", type: "planning", priority: "medium" },
  ],
};

/** 카탈로그의 모든 이벤트가 최소한의 다음 행동을 갖도록 하는 안전망. */
const TYPE_DEFAULTS: Record<LifeEvent["type"], FinEventTemplate[]> = {
  education: [
    { offsetMonths: -3, title: "학업 비용과 지원 확인", type: "opportunity", priority: "high", note: "등록금·생활비와 받을 수 있는 장학·지원 제도를 함께 확인해요." },
    { offsetMonths: -1, title: "학업 기간 생활비 계획", type: "planning", priority: "medium" },
  ],
  career: [
    { offsetMonths: -2, title: "소득 공백 대비하기", type: "planning", priority: "medium", note: "변화 전후의 고정비와 필요한 생활비를 먼저 계산해요." },
    { offsetMonths: 0, title: "계약과 급여 조건 확인", type: "risk", priority: "high" },
    { offsetMonths: 1, title: "새 소득에 맞춰 예산 조정", type: "planning", priority: "medium" },
  ],
  living: [
    { offsetMonths: -4, title: "주거 비용 범위 정하기", type: "planning", priority: "medium" },
    { offsetMonths: -2, title: "받을 수 있는 주거지원 확인", type: "opportunity", priority: "high" },
    { offsetMonths: -1, title: "계약 전 보증금 보호 확인", type: "risk", priority: "high" },
  ],
  finance: [
    { offsetMonths: 0, title: "조건과 비용 확인", type: "check", priority: "high" },
    { offsetMonths: 1, title: "월 예산에 반영하기", type: "planning", priority: "medium" },
  ],
  goal: [
    { offsetMonths: -6, title: "목표 금액과 기간 정하기", type: "planning", priority: "medium" },
    { offsetMonths: -5, title: "월별 준비 금액 계산", type: "planning", priority: "high" },
  ],
};

let seq = 0;
function nextId(): string {
  seq += 1;
  return `fe_${Date.now().toString(36)}_${seq}`;
}

/** YYYY-MM-DD */
function addMonths(base: Date, months: number): string {
  const d = new Date(base.getFullYear(), base.getMonth() + months, base.getDate() || 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 하나의 Life Event 로부터 Fin Event 목록을 생성한다.
 * 날짜가 없으면 체크포인트는 만들되 dueDate를 비워 사용자가 계획을 잃지 않게 한다.
 */
export function generateFinEvents(lifeEvent: LifeEvent, now = new Date()): FinEvent[] {
  const templates = TEMPLATES[lifeEvent.subtype] ?? TYPE_DEFAULTS[lifeEvent.type];
  const base = parseEventDate(lifeEvent.date);

  return templates.map((t) => {
    const dueDate = base ? addMonths(base, t.offsetMonths) : undefined;
    // 이미 지난 체크포인트는 완료로 두지 않고, 아직 유효한 것만 pending 으로 노출한다.
    return {
      id: nextId(),
      userId: lifeEvent.userId,
      lifeEventId: lifeEvent.id,
      title: t.title,
      type: t.type,
      dueDate,
      priority: t.priority,
      status: "pending" as const,
      generatedBy: "rule" as const,
      note: t.note,
    };
  });
}

/** 여러 Life Event 를 한 번에 처리 */
export function generateAllFinEvents(lifeEvents: LifeEvent[], now = new Date()): FinEvent[] {
  return lifeEvents.flatMap((le) => generateFinEvents(le, now));
}
