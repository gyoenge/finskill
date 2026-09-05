/**
 * Event Readiness 계산 (설계 문서 §23·§48).
 *
 * "전체 금융점수"가 아니라 Life Event 별 준비도를 낸다.
 * 각 dimension 점수는 (1) 그 Event 의 체크리스트(Fin Event) 완료 여부와
 * (2) 금융 프로필(FinancialContext) 신호로부터 규칙 기반으로 계산한다 (설계 §40).
 * Progressive Profiling 이 아직 안 채워졌으면 합리적 기본값을 쓴다.
 */

import type { EventReadiness, FinancialContext, FinEvent, LifeEvent } from "./timeline";

interface FinState {
  total: number;
  completed: number;
  /** 완료된 Fin Event 제목 집합 */
  done: Set<string>;
  hasPending: boolean;
}

function finState(finEvents: FinEvent[]): FinState {
  const done = new Set(finEvents.filter((f) => f.status === "completed").map((f) => f.title));
  return {
    total: finEvents.length,
    completed: done.size,
    done,
    hasPending: finEvents.some((f) => f.status === "pending"),
  };
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** 특정 제목의 체크포인트가 완료됐는지에 따라 점수 */
function byCheckpoint(fs: FinState, title: string, done: number, pending: number, none: number): number {
  if (fs.done.has(title)) return done;
  if (fs.hasPending) return pending;
  return none;
}

type Dim = { key: string; label: string; score: number };

interface Ctx {
  fs: FinState;
  fin: FinancialContext | null;
}

/** subtype 별 dimension 계산기 (설계 §23 예: 독립) */
const DIMENSIONS: Record<string, (c: Ctx) => Dim[]> = {
  independence: ({ fs, fin }) => [
    { key: "deposit", label: "보증금", score: fin?.savings ? clamp((fin.savings / 5_000_000) * 100) : 40 },
    {
      key: "cashflow",
      label: "현금흐름",
      score:
        fin?.monthlyIncome && fin?.monthlyExpense
          ? clamp(((fin.monthlyIncome - fin.monthlyExpense) / fin.monthlyIncome) * 100 + 40)
          : 55,
    },
    { key: "emergency", label: "비상자금", score: fin?.emergencyFund ? clamp((fin.emergencyFund / 3_000_000) * 100) : 40 },
    { key: "policy", label: "정책 확인", score: byCheckpoint(fs, "주거지원 확인", 100, 30, 60) },
    { key: "contract", label: "계약 준비", score: byCheckpoint(fs, "계약 전 금융 체크", 100, 45, 50) },
  ],
  graduate: ({ fs, fin }) => [
    { key: "loan", label: "학자금 점검", score: byCheckpoint(fs, "학자금 상태 점검", 100, 40, 50) },
    { key: "living", label: "생활비 계획", score: byCheckpoint(fs, "졸업 이후 생활비 계획", 100, 40, 45) },
    { key: "support", label: "취업지원 확인", score: byCheckpoint(fs, "취업지원 확인", 100, 35, 55) },
    { key: "emergency", label: "비상자금", score: fin?.emergencyFund ? clamp((fin.emergencyFund / 2_000_000) * 100) : 45 },
  ],
  employ: ({ fs, fin }) => [
    { key: "netpay", label: "실수령액 파악", score: byCheckpoint(fs, "실수령액 점검", 100, 45, 50) },
    { key: "budget", label: "월급 배분", score: byCheckpoint(fs, "첫 월급 관리 시작", 100, 40, 45) },
    { key: "emergency", label: "비상금", score: byCheckpoint(fs, "비상금 목표 설정", 100, 40, 50) },
    { key: "asset", label: "자산형성", score: byCheckpoint(fs, "청년 자산형성 확인", 100, 35, 55) },
    { key: "income", label: "소득 안정", score: fin?.monthlyIncome ? 70 : 50 },
  ],
  "student-loan": ({ fs, fin }) => [
    { key: "status", label: "대출 현황", score: byCheckpoint(fs, "학자금 상태 점검", 100, 45, 55) },
    { key: "plan", label: "상환 계획", score: byCheckpoint(fs, "상환 계획 세우기", 100, 40, 45) },
    { key: "cashflow", label: "상환 여력", score: fin?.monthlyIncome ? 65 : 50 },
  ],
};

/** 기본(템플릿 없는 subtype): 체크리스트 완료율 기반 단일 축 */
function fallbackDims(fs: FinState): Dim[] {
  const ratio = fs.total ? (fs.completed / fs.total) * 100 : 50;
  return [{ key: "checklist", label: "준비 체크리스트", score: clamp(ratio) }];
}

export function computeReadiness(
  lifeEvent: LifeEvent,
  finEventsForEvent: FinEvent[],
  fin: FinancialContext | null,
): EventReadiness {
  const fs = finState(finEventsForEvent);
  const dims = (DIMENSIONS[lifeEvent.subtype]?.({ fs, fin }) ?? fallbackDims(fs));
  const overallScore = clamp(dims.reduce((s, d) => s + d.score, 0) / dims.length);
  const lowest = [...dims].sort((a, b) => a.score - b.score)[0];

  return {
    lifeEventId: lifeEvent.id,
    overallScore,
    dimensions: dims,
    nextAction: lowest ? `현재 가장 부족한 부분은 '${lowest.label}'이에요.` : undefined,
  };
}
