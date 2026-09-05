/**
 * 20FIN 지금의 기회 — 데이터 소스 통합 (서버 전용).
 *
 * 기존 백엔드(청년정책·LH·장학금)를 Backend Tool 로 재사용해(설계 §36)
 * 도메인 타입 Opportunity 로 정규화한다. 개인화 랭킹은 클라이언트에서 한다
 * (사용자 Context 가 브라우저 localStorage 에 있으므로).
 */

// route handler(서버)에서만 import 되므로 별도 server-only 가드는 두지 않는다.
import type { Opportunity } from "@/lib/domain/timeline";
import { fetchYouthPolicies, youthKeyAvailable, type YouthPolicy } from "@/lib/agent/api/youth-policy";
import { fetchLhNotices, lhKeyAvailable, isAlwaysOpen, type LhNotice } from "@/lib/agent/api/lh";
import { SCHOLARSHIPS_REAL, SCHOLARSHIP_SOURCE, type ScholarshipRecord } from "@/lib/data/seed/scholarships";

/** "YYYYMMDD" · "YYYY-MM-DD" → "YYYY-MM-DD" (실패 시 undefined) */
function normDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 8 || digits.startsWith("9999")) return undefined;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

const CATEGORY_MAP: Record<string, Opportunity["category"]> = {
  주거: "housing",
  일자리: "employment",
  교육: "education",
  복지문화: "finance",
  참여권리: "finance",
};

function fromYouthPolicy(p: YouthPolicy): Opportunity {
  return {
    id: `policy:${p.id}`,
    title: p.name,
    provider: p.agency || "청년정책",
    category: CATEGORY_MAP[p.category] ?? "finance",
    eligibility: { minAge: p.minAge, maxAge: p.maxAge, regionText: `${p.agency} ${p.name}`, summary: p.support },
    officialUrl: p.applyUrl,
    updatedAt: new Date().toISOString(),
  };
}

function fromLhNotice(n: LhNotice): Opportunity {
  return {
    id: `lh:${n.id}`,
    title: n.title,
    provider: "LH 한국토지주택공사",
    category: "housing",
    eligibility: { regionText: `${n.region} ${n.title}`, type: n.type, alwaysOpen: isAlwaysOpen(n.closesAt) },
    endDate: normDate(n.closesAt),
    officialUrl: n.url,
    updatedAt: new Date().toISOString(),
  };
}

function fromScholarship(s: ScholarshipRecord): Opportunity {
  return {
    id: `scholarship:${s.id}`,
    title: `${s.provider} ${s.name}`,
    provider: s.provider,
    category: "education",
    eligibility: { regionText: `${s.region} ${s.provider}`, amount: s.amount, grade: s.grade, majors: s.majors },
    startDate: normDate(s.applyFrom),
    endDate: normDate(s.applyTo),
    officialUrl: s.url,
    updatedAt: SCHOLARSHIP_SOURCE,
  };
}

export interface OpportunityBundle {
  opportunities: Opportunity[];
  /** 통합 이전 원본 총 개수 — 필터링 UX(설계 §28)의 "N개 확인"에 쓴다 */
  total: number;
  sources: { key: string; label: string; count: number; live: boolean }[];
}

/**
 * 모든 소스를 모아 Opportunity 로 정규화한다.
 * 라이브 소스(청년정책·LH)는 키가 없거나 실패하면 건너뛰고, 장학금(정적 실데이터)은 항상 포함한다.
 */
export async function collectOpportunities(region?: string): Promise<OpportunityBundle> {
  const [policies, notices] = await Promise.all([
    fetchYouthPolicies({ region, size: 60 }).catch(() => null),
    fetchLhNotices({ region, size: 40 }).catch(() => null),
  ]);

  const policyOpps = (policies ?? []).map(fromYouthPolicy);
  const lhOpps = (notices ?? []).map(fromLhNotice);
  const scholarshipOpps = SCHOLARSHIPS_REAL.map(fromScholarship);

  const opportunities = [...policyOpps, ...lhOpps, ...scholarshipOpps];

  return {
    opportunities,
    total: opportunities.length,
    sources: [
      { key: "policy", label: "청년정책", count: policyOpps.length, live: youthKeyAvailable() && policies !== null },
      { key: "lh", label: "LH 주거공고", count: lhOpps.length, live: lhKeyAvailable() && notices !== null },
      { key: "scholarship", label: "장학금", count: scholarshipOpps.length, live: false },
    ],
  };
}
