import type { EvidenceCheck, TraceStep } from "@/lib/types";
import { DEPOSITS, HOUSING, YOUTH_POLICIES } from "@/lib/data/seed";
import { SCHOLARSHIPS_REAL } from "@/lib/data/seed/scholarships";

/**
 * 근거 검증 (README §19 확장, §34 안전 설계의 검증 장치).
 *
 * "숫자는 Skill 이 계산한 값을 그대로 인용한다" 는 프롬프트 규칙을 말로만 두지 않고,
 * 답변에 등장한 수치·고유명을 Skill 이 만든 사실(facts)과 결정론적으로 대조한다.
 * LLM 을 다시 부르지 않으므로 비용도 지연도 늘지 않는다.
 *
 * 대조 대상은 §34 가 "코드가 책임진다" 고 규정한 것들로 한정한다.
 *   - 금액 / 비율 / 점수 등 수치
 *   - 날짜
 *   - 공고명·상품명 같은 고유명
 * 서술 문장의 사실성까지 판정하지는 않는다.
 */

/** 답변·근거에서 뽑아낸 수치 하나 */
interface Num {
  raw: string;
  value: number;
  /** 원·%·건 같은 단위가 붙었는지 — 사실 주장인지 판별하는 데 쓴다 */
  hasUnit: boolean;
}

const UNIT: Record<string, number> = { 억: 1e8, 만: 1e4, 천: 1e3 };

/**
 * "3,657,740원", "260만원", "3.5%", "920점" 등을 정규화한다.
 * 원 단위로 환산할 수 있으면 환산하고, 아니면 표기 그대로의 수를 쓴다.
 */
function extractNumbers(text: string): Num[] {
  const out: Num[] = [];
  const re = /([0-9][0-9,]*(?:\.[0-9]+)?)\s*(억|만|천)?\s*(원|%|점|개월|년|건|개)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const digits = m[1].replace(/,/g, "");
    const n = Number(digits);
    if (!Number.isFinite(n)) continue;
    const scale = m[2] ? UNIT[m[2]] : 1;
    out.push({ raw: m[0].trim(), value: n * scale, hasUnit: Boolean(m[2] || m[3]) });
  }
  return out;
}

// 원문이 "2026. 3. 30." 처럼 공백을 넣는 경우가 있어 구분자 주변 공백을 허용한다.
const DATE_RE = /(20\d{2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})/g;

/**
 * 날짜를 지운 텍스트.
 * "2026.09.20" 을 숫자 추출기에 그대로 넣으면 "2026.09" 와 "20" 으로 쪼개져
 * 검증 목록이 노이즈로 오염된다. 날짜는 날짜로만 대조한다.
 */
function withoutDates(text: string): string {
  return text.replace(DATE_RE, " ");
}

/** 날짜 표기 (2026.09.20 / 2026-09-20) */
function extractDates(text: string): string[] {
  const out: string[] = [];
  const re = new RegExp(DATE_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(`${m[1]}.${m[2].padStart(2, "0")}.${m[3].padStart(2, "0")}`);
  }
  return out;
}

/**
 * 연도 없는 축약 날짜.
 *
 * 슬래시("9/20")와 "9월 20일" 만 인정하고 마침표 형식("9.20")은 제외한다.
 * 한국어 금융·학사 텍스트에서 "2.5"(평점) "3.5"(금리) "4.5"(만점) 같은 소수가
 * 훨씬 흔해서, 마침표까지 날짜로 보면 오탐이 걷잡을 수 없다.
 * 연도가 붙은 "2026.09.20" 형태는 DATE_RE 가 따로 처리한다.
 */
const MD_RE = /(?<!\d)(\d{1,2})\s*(?:\/|월\s*)(\d{1,2})\s*일?(?![\d만원%억천점개])/g;

/**
 * 연도 없는 날짜(9/17, 9월 17일)를 "MM.DD" 로 뽑는다.
 * LLM 이 "마감 2026.09.17" 을 "9/17 마감" 으로 줄여 쓰는 경우가 많은데,
 * 그대로 두면 17 · 21 같은 조각 숫자가 미확인으로 잡힌다.
 */
function extractMonthDays(text: string): string[] {
  const out: string[] = [];
  const re = new RegExp(MD_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const mm = Number(m[1]);
    const dd = Number(m[2]);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      out.push(`${String(mm).padStart(2, "0")}.${String(dd).padStart(2, "0")}`);
    }
  }
  return out;
}

/**
 * 유효한 월-일 표기만 지운다.
 * MD_RE 는 "45.2" 같은 소수도 형태상 매칭하므로 무조건 지우면
 * "저축률 45.2%" 의 비율이 통째로 사라져 환각을 놓친다.
 */
function withoutMonthDays(text: string): string {
  return text.replace(new RegExp(MD_RE.source, "g"), (whole, a: string, b: string) => {
    const mm = Number(a);
    const dd = Number(b);
    return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 ? " " : whole;
  });
}

/** 시드 데이터 전체의 고유명 — 이번 실행 결과에 없는데 답변에 나오면 환각 신호 */
const ALL_ENTITY_NAMES: string[] = [
  ...HOUSING.map((h) => h.title),
  ...SCHOLARSHIPS_REAL.map((s) => s.name),
  ...YOUTH_POLICIES.map((p) => p.name),
  ...DEPOSITS.map((d) => d.name),
];

/** 소수 오차·반올림을 허용한 수치 일치 판정 */
function matches(claim: Num, evidence: Num[]): boolean {
  return evidence.some((e) => {
    if (e.raw === claim.raw) return true;
    if (claim.value === 0 || e.value === 0) return claim.value === e.value;
    // "3,657,740원" 을 "약 366만원" 으로 반올림해 쓰는 경우까지 인정한다.
    const diff = Math.abs(claim.value - e.value) / Math.max(Math.abs(e.value), 1);
    return diff < 0.01;
  });
}

export function checkEvidence(answer: string, traces: { facts: string }[]): EvidenceCheck {
  const evidenceText = traces.map((t) => t.facts).join("\n");

  // 실행된 Skill 이 없으면 대조할 근거 자체가 없다. 이 경우는 판정하지 않는다.
  if (!evidenceText.trim()) {
    return { verified: [], unverified: [], strayEntities: [] };
  }

  const evNums = extractNumbers(withoutDates(evidenceText));
  const evDates = new Set(extractDates(evidenceText));
  // 근거 날짜에 등장한 연도. 답변이 "2026년" 처럼 연도만 언급하는 경우를 인정한다.
  const evYears = new Set(Array.from(evDates, (d) => d.slice(0, 4)));
  // 근거 날짜의 월-일. 답변의 축약 날짜와 대조한다.
  const evMonthDays = new Set(Array.from(evDates, (d) => d.slice(5)));

  const verified: string[] = [];
  const unverified: string[] = [];

  // 축약 날짜를 먼저 처리하고, 그 조각이 숫자로 다시 잡히지 않도록 지운다.
  const answerBody = withoutDates(answer);
  for (const md of extractMonthDays(answerBody)) {
    (evMonthDays.has(md) ? verified : unverified).push(md.replace(".", "/"));
  }

  for (const claim of extractNumbers(withoutMonthDays(answerBody))) {
    // 단위 없는 작은 수(순번·조각)는 사실 주장으로 보기 어렵다.
    // 금액·비율·점수는 거의 항상 단위가 붙는다.
    if (!claim.hasUnit && claim.value < 1000) continue;
    if (claim.value < 10) continue;
    // 날짜에서 파생된 연도 언급("2026년")은 근거 날짜의 연도와 대조한다.
    if (/^20\d{2}\s*년?$/.test(claim.raw) && evYears.has(String(claim.value))) {
      verified.push(claim.raw);
      continue;
    }
    (matches(claim, evNums) ? verified : unverified).push(claim.raw);
  }

  for (const d of extractDates(answer)) {
    (evDates.has(d) ? verified : unverified).push(d);
  }

  // 이번 실행 결과에 없는 공고명·상품명을 답변이 언급했는지
  const strayEntities = ALL_ENTITY_NAMES.filter(
    (name) => answer.includes(name) && !evidenceText.includes(name),
  );

  return {
    verified: dedupe(verified),
    unverified: dedupe(unverified),
    strayEntities: dedupe(strayEntities),
  };
}

function dedupe(xs: string[]): string[] {
  return Array.from(new Set(xs));
}

/** Trace 에서 검증에 쓸 facts 만 추린다 */
export function factsOf(traces: (TraceStep & { facts: string })[]) {
  return traces.map((t) => ({ facts: t.facts }));
}
