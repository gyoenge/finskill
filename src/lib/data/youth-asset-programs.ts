/**
 * 청년 자산형성 제도 조건표.
 *
 * ⚠️ 이 파일이 유일한 진실 공급원이다. 제도 조건이 바뀌면 여기만 고치면 된다.
 *    항목마다 verifiedAt(확인일자)과 sources(출처)를 달아두었으니,
 *    수정할 때 함께 갱신할 것.
 *
 * ⚠️ 2026.09.02 조사 기준 초안이다. 확정 전 반드시 공식 공고로 재확인해야 한다.
 *    가입요건과 중복제한을 틀리면 사용자가 수백만원의 기회손실을 볼 수 있다.
 */

export type ProgramStatus =
  /** 현재 신규가입 가능 */
  | "active"
  /** 신규가입 종료 (기존 가입자만 유지) */
  | "closed"
  /** 개정안 단계 — 국회 통과 전이므로 확정 아님 */
  | "proposed";

export interface ProgramTier {
  id: string;
  label: string;
  /** 개인소득(연) 상한, 원. null = 제한 없음 */
  personalIncomeMax: number | null;
  /** 가구 기준중위소득 상한, %. null = 제한 없음 */
  householdMedianMax: number | null;
  /** 정부기여금 매칭률 % (납입액 대비) */
  matchRate: number;
}

export interface YouthProgram {
  id: string;
  name: string;
  agency: string;
  status: ProgramStatus;
  /** 조건 확인일자 */
  verifiedAt: string;
  sources: string[];
  /** 상태·불확실성에 대한 주의 문구 */
  note?: string;
  age: { min: number; max: number; note?: string };
  termMonths: number;
  /** 월 납입 한도, 원 */
  monthlyMax: number;
  /** 소득구간별 우대 (없으면 단일 구간) */
  tiers: ProgramTier[];
  /** 정액 매칭(원/월). 청년내일저축계좌처럼 비율이 아닌 정액인 경우 */
  matchFixedMonthly?: number;
  /** 가입에 근로·사업소득이 필요한지 */
  requiresEarnedIncome?: boolean;
  taxFree: boolean;
  /** 정부기여금이 아닌 세제혜택만 있는 상품인지 (조합 최적화에서 제외) */
  taxBenefitOnly?: boolean;
}

export const YOUTH_PROGRAMS: YouthProgram[] = [
  {
    id: "future-savings",
    name: "청년미래적금",
    agency: "금융위원회 · 서민금융진흥원",
    status: "active",
    verifiedAt: "2026.09.02",
    sources: [
      "서민금융진흥원 청년미래적금 상품안내",
      "금융위원회 보도자료 (청년미래적금 가입절차·심사일정)",
      "대한민국 정책브리핑 2026.06",
    ],
    note: "청년도약계좌를 대체해 2026.6.22 출시되어 운영 중이다. 가입 신청은 반기별로 열리므로 현재 신청기간이 열려 있는지 확인이 필요하다.",
    age: { min: 19, max: 34, note: "최초 가입 기준 1991.1.1~2007.8.7생" },
    termMonths: 36,
    monthlyMax: 500_000,
    taxFree: true,
    tiers: [
      {
        id: "preferential",
        label: "우대형",
        personalIncomeMax: 36_000_000,
        householdMedianMax: 150,
        matchRate: 12,
      },
      {
        id: "general",
        label: "일반형",
        personalIncomeMax: 60_000_000,
        householdMedianMax: 200,
        matchRate: 6,
      },
    ],
  },
  {
    id: "tomorrow-savings",
    name: "청년내일저축계좌",
    agency: "보건복지부",
    status: "active",
    verifiedAt: "2026.09.02",
    sources: ["관악구청 청년내일저축계좌(2026) 안내", "부산청년플랫폼"],
    note:
      "⚠️ 가구소득 기준이 자료마다 50%/100%/120% 로 엇갈린다. 2026 하반기 확대안(중위 120%, 만 18~39세, 매칭 40만원)은 '제시된 방안' 단계. 공고로 반드시 확인할 것.",
    age: { min: 19, max: 34, note: "차상위 이하는 만 15~39세" },
    termMonths: 36,
    // 본인 납입 기준액. 이 금액을 넣어야 정액 매칭을 받는다.
    monthlyMax: 100_000,
    matchFixedMonthly: 300_000,
    requiresEarnedIncome: true,
    taxFree: false,
    tiers: [
      {
        id: "base",
        label: "기본",
        personalIncomeMax: null,
        householdMedianMax: 100,
        matchRate: 0,
      },
    ],
  },
  {
    id: "leap-account",
    name: "청년도약계좌",
    agency: "금융위원회",
    status: "closed",
    verifiedAt: "2026.09.02",
    sources: ["금융위원회 보도자료", "뉴스1 2026.06 (청년도약계좌 중도해지해야 청년미래적금 가입 가능)"],
    note: "신규가입 종료. 청년미래적금으로 개편되었다. 기존 가입자 판정에만 사용한다.",
    age: { min: 19, max: 34 },
    termMonths: 60,
    monthlyMax: 700_000,
    taxFree: true,
    tiers: [
      { id: "base", label: "기본", personalIncomeMax: 75_000_000, householdMedianMax: 250, matchRate: 0 },
    ],
  },
  {
    id: "isa",
    name: "ISA (개인종합자산관리계좌)",
    agency: "금융위원회 · 기획재정부",
    status: "active",
    verifiedAt: "2026.09.02",
    sources: ["국회예산정책처 ISA 현황 및 쟁점 (2026.04)", "헤럴드경제 2026 세법개정안 보도"],
    note:
      "⚠️ 2026 세제개편안(연 납입 4,000만원·비과세 일반 500/서민 1,000만원, 생산적금융 ISA 신설)은 국회 통과 전 개정안이다. 현행 조건과 구분해 안내할 것.",
    age: { min: 19, max: 200, note: "청년 전용 제도가 아님" },
    termMonths: 36,
    monthlyMax: 1_666_666,
    taxFree: true,
    // 정부기여금이 없고 비과세만 있으므로 기여금 최적화 대상에서 제외한다.
    taxBenefitOnly: true,
    tiers: [
      { id: "base", label: "일반형", personalIncomeMax: null, householdMedianMax: null, matchRate: 0 },
    ],
  },
];

/** 제도 간 관계 — 중복 가입 가능 여부 */
export interface ProgramRelation {
  a: string;
  b: string;
  compatible: boolean;
  reason: string;
  exception?: string;
  sources: string[];
  verifiedAt: string;
}

export const PROGRAM_RELATIONS: ProgramRelation[] = [
  {
    a: "future-savings",
    b: "leap-account",
    compatible: false,
    reason: "동일 취지의 금융위 자산형성 상품이라 중복가입이 제한된다.",
    exception:
      "청년미래적금 최초 가입신청 기간에 한해 청년도약계좌에서 갈아타기가 허용되었다. 단 청년도약계좌를 5년 만기까지 유지한 사람은 청년미래적금 가입 대상이 아니다.",
    sources: ["금융위원회 보도자료", "뉴스1 2026.06"],
    verifiedAt: "2026.09.02",
  },
  {
    a: "tomorrow-savings",
    b: "leap-account",
    compatible: true,
    reason: "복지부 사업과 금융위 사업으로 소관 부처가 달라 동시 가입이 가능하다.",
    sources: ["부산청년플랫폼 청년내일저축계좌 안내"],
    verifiedAt: "2026.09.02",
  },
  {
    a: "tomorrow-savings",
    b: "future-savings",
    compatible: true,
    reason:
      "청년내일저축계좌는 금융위 자산형성 상품을 중복 대상사업으로 보지 않는다. 청년도약계좌와 동시 가입이 가능했던 것과 같은 이유다.",
    exception: "⚠️ 청년미래적금 출시 이후 기준으로는 공고 재확인이 필요하다.",
    sources: ["부산청년플랫폼 (청년희망적금·청년도약계좌는 중복 대상사업 아님)"],
    verifiedAt: "2026.09.02",
  },
  {
    a: "tomorrow-savings",
    b: "local-asset-program",
    compatible: false,
    reason: "지자체 유사 자산형성지원사업(예: 부산 기쁨두배통장)과는 중복가입이 불가하다.",
    sources: ["부산청년플랫폼"],
    verifiedAt: "2026.09.02",
  },
];

/** 아직 조사하지 않은 제도 — 추측으로 채우지 않는다 */
export const NOT_YET_RESEARCHED = [
  "청년주택드림청약통장 (청년우대형 청약통장 후속)",
  "내일채움공제 / 청년재직자내일채움공제",
  "지자체 자산형성사업 (서울 희망두배청년통장 등)",
];

export const PROGRAM_MAP: Record<string, YouthProgram> = Object.fromEntries(
  YOUTH_PROGRAMS.map((p) => [p.id, p]),
);
