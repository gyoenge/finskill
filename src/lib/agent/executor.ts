import {
  DEPOSITS,
  FRAUD_ACTIONS,
  FRAUD_PATTERNS,
  HOUSING,
  SCHOLARSHIPS,
  TERM_DOCS,
  YOUTH_POLICIES,
} from "@/lib/data/seed";
import type { Skill } from "@/lib/types";
import { fetchLhNotices, lhKeyAvailable, noticeFacts } from "@/lib/agent/api/lh";
import { buildAssetPlan, planFacts, type AssetProfile } from "@/lib/agent/youth-asset";

/**
 * Skill Executor (README §20, §34)
 *
 * 여기 있는 모든 함수는 deterministic code 다.
 * LLM 은 어떤 Skill 을 부를지 고르고 결과를 설명할 뿐,
 * 검색 필터링·금융 계산·자격 판정은 전부 이 파일이 수행한다.
 */

export interface SkillResult {
  /** Skill Trace 에 표시되는 한 줄 요약 (§19) */
  summary: string;
  sources: string[];
  /** UI 카드 렌더링용 구조화 결과 */
  data: unknown;
  /** LLM 에게 넘길 사실 근거 텍스트 */
  facts: string;
  /**
   * Recipe 실행 시 다음 단계로 넘길 값 (§15).
   * 예: 소비 분석이 산출한 월 여유자금 → 목표저축 플래너의 capacity
   */
  carry?: Record<string, number>;
}

export interface ExecContext {
  /** 사용자 원문 */
  query: string;
  /** 온보딩/명시 입력에서 온 파라미터 */
  params: Record<string, string | number | undefined>;
}

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const manwon = (n: number) => `${n.toLocaleString("ko-KR")}만원`;

/* ------------------------- 입력 파싱 ------------------------- */

const REGIONS = [
  "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
  "관악", "동작", "노원", "성동", "서대문", "마포", "강남", "성남", "부산진",
];

/**
 * "월세 55만원", "1000만원 모으고 싶어" 같은 한국어 금액 표기를 원 단위로 변환한다.
 * 금액은 키워드 뒤("월세 55만원")에도, 앞("1000만원 모으고")에도 올 수 있으므로 양방향으로 찾는다.
 */
export function parseMoney(text: string, keywords: string[]): number | undefined {
  for (const kw of keywords) {
    const after = text.match(new RegExp(`${kw}[^0-9]{0,8}([0-9,]+)\\s*(만원|만|원)?`));
    if (after) return toWon(after[1], after[2]);
    const before = text.match(new RegExp(`([0-9,]+)\\s*(만원|만|원)?[^0-9]{0,6}${kw}`));
    if (before) return toWon(before[1], before[2]);
  }
  return undefined;
}

function toWon(num: string, unit?: string): number {
  const n = Number(num.replace(/,/g, ""));
  if (!Number.isFinite(n)) return 0;
  return unit === "원" ? n : n * 10000;
}

export function extractParams(query: string, skill: Skill): Record<string, string | number | undefined> {
  const p: Record<string, string | number | undefined> = {};
  const region = REGIONS.find((r) => query.includes(r));
  if (region) p.region = region;

  const months = query.match(/([0-9]+)\s*(개월|달)/);
  if (months) p.months = Number(months[1]);
  const years = query.match(/([0-9]+)\s*년/);
  if (years && !p.months) p.months = Number(years[1]) * 12;

  const rate = query.match(/(?:연\s*)?([0-9]+(?:\.[0-9]+)?)\s*%/);
  if (rate) p.rate = Number(rate[1]);

  // "월수입"과 "월 30만원씩"을 구분하기 위해 납입액 키워드는 공백을 포함해 좁게 잡는다.
  const monthly = parseMoney(query, ["매달", "매월", "월 납입", "납입", "월 ", "씩"]);
  if (monthly) p.monthly = monthly;

  const income = parseMoney(query, ["월수입", "수입", "월급", "급여", "소득이", "버는", "벌어"]);
  if (income) p.income = income;

  const rent = parseMoney(query, ["월세", "주거비", "집세", "임대료"]);
  if (rent) p.rent = rent;

  const food = parseMoney(query, ["식비", "밥값", "식대"]);
  if (food) p.food = food;

  const transport = parseMoney(query, ["교통비", "교통"]);
  if (transport) p.transport = transport;

  const etc = parseMoney(query, ["기타지출", "기타", "그 외"]);
  if (etc) p.etc = etc;

  const goal = parseMoney(query, ["목표", "모으", "만들"]);
  if (goal) p.goal = goal;

  const capacity = parseMoney(query, ["저축 가능", "저축할 수", "여유자금", "여윳돈"]);
  if (capacity) p.capacity = capacity;

  const tuition = parseMoney(query, ["등록금"]);
  if (tuition) p.tuition = tuition;

  const scholarship = parseMoney(query, ["장학금"]);
  if (scholarship) p.scholarship = scholarship;

  const median = query.match(/중위\s*(?:소득)?\s*([0-9]+)\s*%/);
  if (median) p.householdMedianPct = Number(median[1]);

  const ageM = query.match(/(?:만\s*)?([1-9][0-9])\s*(?:세|살)/);
  if (ageM) p.age = Number(ageM[1]);

  const annual = parseMoney(query, ["연봉", "총급여", "연소득"]);
  if (annual) p.personalIncome = annual;

  const level = query.match(/([0-9]+)\s*분위/);
  if (level) p.incomeLevel = Number(level[1]);

  const grade = query.match(/([1-4])\s*학년/);
  if (grade) p.grade = `${grade[1]}학년`;

  // 보증금 상한
  const dep = parseMoney(query, ["보증금"]);
  if (dep) p.maxDeposit = dep / 10000; // 만원 단위

  if (skill.executor.ref === "fin_term_explain") p.term = query;
  if (skill.executor.ref === "fraud_check") p.message = query;
  return p;
}

/* ------------------------- Executors ------------------------- */

/** 실제 외부 API 를 부르는 Skill 이 있으므로 비동기도 허용한다 */
type Handler = (ctx: ExecContext) => SkillResult | Promise<SkillResult>;

const housingSearch = (agency: "SH" | "LH"): Handler => (ctx) => {
  const region = String(ctx.params.region ?? "");
  const maxDeposit = Number(ctx.params.maxDeposit ?? 0);
  let list = HOUSING.filter((h) => h.agency === agency);
  const total = list.length;
  if (region) {
    const filtered = list.filter((h) => h.region.includes(region) || h.region === "전국");
    if (filtered.length) list = filtered;
  }
  if (maxDeposit > 0) list = list.filter((h) => h.deposit <= maxDeposit);
  list = list.sort((a, b) => a.deposit + a.monthlyRent * 12 - (b.deposit + b.monthlyRent * 12));

  const facts = list.length
    ? list
        .map(
          (h) =>
            `- ${h.title} | ${h.region} | ${h.type} | 보증금 ${manwon(h.deposit)} / 월 ${manwon(h.monthlyRent)} | 접수 ${h.applyFrom}~${h.applyTo} | 자격: ${h.eligibility.join(", ")}`,
        )
        .join("\n")
    : `${agency} 공고 중 조건에 맞는 결과가 없습니다.`;

  // 가장 부담이 적은 공고의 보증금을 뒤 단계(목표저축 플래너)의 목표 금액으로 넘긴다.
  // 독립준비 Recipe 에서 "이 집에 들어가려면 얼마를 언제까지 모아야 하는가" 로 이어진다.
  const cheapest = list[0];

  return {
    summary: `${total}개 공고 중 조건에 맞는 ${list.length}건`,
    sources: agency === "SH" ? ["SH 서울주택도시공사", "공공데이터포털"] : ["LH 한국토지주택공사", "공공데이터포털"],
    data: { kind: "housing", items: list },
    facts,
    carry: cheapest ? { goal: cheapest.deposit * 10000 } : undefined,
  };
};

const scholarshipSearch: Handler = (ctx) => {
  const level = Number(ctx.params.incomeLevel ?? 0);
  const grade = String(ctx.params.grade ?? "");
  const region = String(ctx.params.region ?? "");
  const majorHit = ["공학", "이공", "자연", "컴퓨터", "공대"].find((m) => ctx.query.includes(m));

  let list = [...SCHOLARSHIPS];
  const total = list.length;
  if (level > 0) list = list.filter((s) => s.incomeLevel === null || s.incomeLevel >= level);
  if (grade) list = list.filter((s) => s.grades.includes(grade));
  if (region) list = list.filter((s) => s.region === "전국" || s.region.includes(region));
  if (majorHit) {
    const m = list.filter((s) => s.majors.includes("전체") || s.majors.some((x) => ["공학", "이공", "자연과학"].includes(x)));
    if (m.length) list = m;
  }
  list = list.sort((a, b) => a.deadline.localeCompare(b.deadline));

  const facts = list.length
    ? list
        .map((s) => `- ${s.name} (${s.provider}) | ${s.amount} | 마감 ${s.deadline} | 조건: ${s.conditions.join(", ")}`)
        .join("\n")
    : "입력한 조건으로 지원 가능한 장학금을 찾지 못했습니다.";

  return {
    summary: `${total}개 중 ${list.length}개 후보 매칭`,
    sources: ["한국장학재단", "공공데이터포털"],
    data: { kind: "scholarship", items: list },
    facts,
  };
};

const youthPolicySearch: Handler = (ctx) => {
  const region = String(ctx.params.region ?? "");
  const topicHit = (["주거", "자산형성", "취업", "교육", "생활"] as const).find(
    (t) =>
      ctx.query.includes(t) ||
      (t === "주거" && /월세|전세|집|자취|주택|보증금/.test(ctx.query)) ||
      (t === "자산형성" && /저축|모으|자산|목돈|계좌/.test(ctx.query)) ||
      (t === "취업" && /취업|구직|알바|일자리/.test(ctx.query)),
  );

  let list = [...YOUTH_POLICIES];
  const total = list.length;
  if (region) list = list.filter((p) => p.region === "전국" || p.region.includes(region));
  if (topicHit) {
    const t = list.filter((p) => p.topic === topicHit);
    if (t.length) list = t;
  }

  const facts = list
    .map((p) => `- ${p.name} (${p.agency}) | ${p.benefit} | 신청 ${p.deadline} | 자격: ${p.eligibility.join(", ")}`)
    .join("\n");

  return {
    summary: `${total}개 정책 중 ${list.length}건 해당`,
    sources: ["온통청년(청년정책포털)", "공공데이터포털"],
    data: { kind: "policy", items: list },
    facts,
  };
};

const finTermExplain: Handler = (ctx) => {
  const q = ctx.query.toLowerCase();
  const scored = TERM_DOCS.map((d) => {
    let score = 0;
    for (const a of d.aliases) if (q.includes(a.toLowerCase())) score += 10;
    for (const w of d.term.split(/[\s()]/)) if (w.length > 1 && q.includes(w.toLowerCase())) score += 4;
    return { d, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const hits = (scored.length ? scored : TERM_DOCS.map((d) => ({ d, score: 0 })).slice(0, 2)).slice(0, 2).map((x) => x.d);

  const facts = hits
    .map((d) => `[${d.term}] ${d.summary}\n상세: ${d.detail}\n주의: ${d.caution}\n출처: ${d.source}`)
    .join("\n\n");

  return {
    summary: scored.length ? `공식 문서 ${hits.length}건 인용` : "관련 문서 없음 — 일반 설명으로 대체",
    sources: hits.map((d) => d.source),
    data: { kind: "terms", items: hits },
    facts,
  };
};

const savingsCalc: Handler = (ctx) => {
  const monthly = Number(ctx.params.monthly ?? 300000);
  const months = Number(ctx.params.months ?? 12);
  const rate = Number(ctx.params.rate ?? 3.5);

  const principal = monthly * months;
  // 적금 단리: 각 회차 납입금이 남은 개월 수만큼만 이자를 받는다.
  const interest = (monthly * rate * 0.01 * ((months * (months + 1)) / 2)) / 12;
  const tax = interest * 0.154; // 이자소득세 15.4%
  const net = principal + interest - tax;

  const facts = [
    `월 납입액 ${won(monthly)}, 기간 ${months}개월, 연 ${rate}% 단리 기준 계산 결과`,
    `원금 합계: ${won(principal)}`,
    `세전 이자: ${won(interest)}`,
    `이자소득세(15.4%): ${won(tax)}`,
    `세후 만기 수령액: ${won(net)}`,
    `참고: 실효 수익률은 표시금리의 약 ${((interest / principal) * 100).toFixed(2)}% 수준입니다.`,
  ].join("\n");

  return {
    summary: `만기 수령액 ${won(net)} 계산`,
    sources: ["결정론적 계산 (FinSkill Calculator)"],
    data: { kind: "savings", monthly, months, rate, principal, interest, tax, net },
    facts,
  };
};

const spendingAnalyze: Handler = (ctx) => {
  const income = Number(ctx.params.income ?? 0);
  const rent = Number(ctx.params.rent ?? 0);
  const food = Number(ctx.params.food ?? 0);
  const transport = Number(ctx.params.transport ?? 0);
  const etc = Number(ctx.params.etc ?? 0);

  if (!income) {
    return {
      summary: "수입 정보 없음 — 입력 필요",
      sources: ["사용자 입력값"],
      data: { kind: "spending", needsInput: true },
      facts: "사용자의 월 수입 정보가 없어 분석할 수 없습니다. 월 수입과 주요 지출 항목을 물어보세요.",
    };
  }

  const items = [
    { label: "주거비", value: rent, fixed: true },
    { label: "식비", value: food, fixed: false },
    { label: "교통비", value: transport, fixed: true },
    { label: "기타", value: etc, fixed: false },
  ].filter((i) => i.value > 0);

  const spend = items.reduce((a, b) => a + b.value, 0);
  const fixed = items.filter((i) => i.fixed).reduce((a, b) => a + b.value, 0);
  const saving = income - spend;
  const savingRate = (saving / income) * 100;
  const top = items.slice().sort((a, b) => b.value - a.value)[0];
  const housingRatio = rent ? (rent / income) * 100 : 0;
  // 주거비 권장 상한 25% 기준 절감 가능액
  const reducible = housingRatio > 25 ? rent - income * 0.25 : 0;

  const facts = [
    `월 수입 ${won(income)}, 총 지출 ${won(spend)}, 잔액 ${won(saving)}`,
    `저축률 ${savingRate.toFixed(1)}%`,
    `고정비 비중 ${((fixed / income) * 100).toFixed(1)}%`,
    top ? `가장 큰 지출: ${top.label} ${won(top.value)} (수입의 ${((top.value / income) * 100).toFixed(1)}%)` : "",
    housingRatio ? `주거비 비중 ${housingRatio.toFixed(1)}% (권장 25% 이하)` : "",
    reducible > 0 ? `주거비를 권장선까지 낮추면 월 ${won(reducible)} 절감 가능` : "",
    savingRate < 20 ? "저축률이 20% 미만으로 자산형성 속도가 느립니다." : "저축률이 양호합니다.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary: `저축률 ${savingRate.toFixed(1)}% · 최대 지출 ${top?.label ?? "-"}`,
    sources: ["사용자 입력값", "통계청 가계동향조사(비교 기준)"],
    data: { kind: "spending", income, items, spend, saving, savingRate, housingRatio, reducible, top },
    facts,
    // 남는 돈을 뒤 단계로 넘긴다.
    //  capacity → 목표저축 플래너의 월 저축 가능액
    //  monthly  → 적금 계산의 월 납입액 (임의값 대신 실제 여력으로 계산)
    carry: { capacity: Math.max(saving, 0), monthly: Math.max(saving, 0), income },
  };
};

const goalPlan: Handler = (ctx) => {
  const goal = Number(ctx.params.goal ?? 0);
  const months = Number(ctx.params.months ?? 12);
  const capacity = Number(ctx.params.capacity ?? 0);

  if (!goal) {
    return {
      summary: "목표 금액 없음 — 입력 필요",
      sources: ["사용자 입력값"],
      data: { kind: "goal", needsInput: true },
      facts: "목표 금액과 기한이 필요합니다. 사용자에게 물어보세요.",
    };
  }

  const required = goal / months;
  const gap = capacity > 0 ? required - capacity : 0;
  const achievableMonths = capacity > 0 ? Math.ceil(goal / capacity) : null;

  const steps = [
    `1단계 · 비상금 확보: 월 고정지출의 3개월치를 먼저 파킹통장에 모읍니다.`,
    `2단계 · 자동이체 설정: 월급일 다음 날 ${won(Math.min(required, capacity || required))} 자동이체를 겁니다.`,
    `3단계 · 목표 계좌 분리: 목표저축 전용 계좌를 만들어 생활비 계좌와 섞지 않습니다.`,
    gap > 0
      ? `4단계 · 부족분 대응: 매달 ${won(gap)}이 부족합니다. 기한을 ${achievableMonths}개월로 늘리거나 지출을 줄여야 합니다.`
      : `4단계 · 점검 주기: 3개월마다 달성률을 확인하고 납입액을 조정합니다.`,
  ];

  const facts = [
    `목표 ${won(goal)}을 ${months}개월 안에 모으려면 매달 ${won(required)}이 필요합니다.`,
    capacity > 0 ? `현재 월 저축 가능액 ${won(capacity)} → ${gap > 0 ? `월 ${won(gap)} 부족` : "목표 달성 가능"}` : "",
    achievableMonths ? `현재 저축 여력으로는 ${achievableMonths}개월 소요됩니다.` : "",
    steps.join("\n"),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary: `월 ${won(required)} 필요 · ${gap > 0 ? "부족분 있음" : "달성 가능"}`,
    sources: ["결정론적 계산 (FinSkill Calculator)"],
    data: { kind: "goal", goal, months, required, capacity, gap, achievableMonths, steps },
    facts,
  };
};

const tuitionPlan: Handler = (ctx) => {
  const tuition = Number(ctx.params.tuition ?? 0);
  const scholarship = Number(ctx.params.scholarship ?? 0);
  const semesters = Number(ctx.params.semesters ?? 1);

  if (!tuition) {
    return {
      summary: "등록금 정보 없음 — 입력 필요",
      sources: ["사용자 입력값"],
      data: { kind: "tuition", needsInput: true },
      facts: "학기 등록금 금액이 필요합니다. 사용자에게 물어보세요.",
    };
  }

  const perSemester = Math.max(tuition - scholarship, 0);
  const totalNeed = perSemester * semesters;
  // 취업 후 상환 학자금대출 기준 이자율 예시
  const loanRate = 1.7;
  const monthlyIfSaved = perSemester / 6; // 학기(6개월) 분산 저축

  const facts = [
    `학기 등록금 ${won(tuition)}, 확보 장학금 ${won(scholarship)}`,
    `학기당 실부담액: ${won(perSemester)}`,
    semesters > 1 ? `남은 ${semesters}학기 총 필요액: ${won(totalNeed)}` : "",
    `6개월에 나눠 모을 경우 월 ${won(monthlyIfSaved)}`,
    `학자금대출로 충당 시(취업 후 상환, 연 ${loanRate}% 가정) 학기당 연이자 약 ${won(perSemester * loanRate * 0.01)}`,
    "취업 후 상환 학자금대출은 상환기준소득을 넘긴 시점부터 소득의 일정 비율로 상환합니다.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary: `실부담 ${won(perSemester)} 산출`,
    sources: ["한국장학재단 학자금대출 안내", "결정론적 계산"],
    data: { kind: "tuition", tuition, scholarship, perSemester, semesters, totalNeed, monthlyIfSaved },
    facts,
    // 실부담 등록금을 뒤 단계(목표저축 플래너)의 목표 금액으로 넘긴다.
    carry: { goal: perSemester },
  };
};

const depositCompare: Handler = (ctx) => {
  const months = Number(ctx.params.months ?? 0);
  const kind = ctx.query.includes("예금") && !ctx.query.includes("적금") ? "예금" : undefined;

  let list = [...DEPOSITS];
  const total = list.length;
  if (months) {
    const m = list.filter((d) => d.months.includes(months));
    if (m.length) list = m;
  }
  if (kind) list = list.filter((d) => d.kind === kind);
  list = list.sort((a, b) => b.maxRate - a.maxRate);

  const facts = list
    .map(
      (d) =>
        `- ${d.bank} ${d.name} (${d.kind}) | 기본 ${d.baseRate}% / 최고 ${d.maxRate}% | 기간 ${d.months.join("·")}개월 | 우대조건: ${d.conditions.join(", ")}`,
    )
    .join("\n");

  return {
    summary: `${total}개 상품 중 ${list.length}건 비교`,
    sources: ["금융감독원 금융상품통합비교공시", "은행연합회"],
    data: { kind: "deposit", items: list },
    facts: `${facts}\n주의: 최고금리는 우대조건을 모두 충족했을 때의 값입니다.`,
  };
};

const creditCoach: Handler = (ctx) => {
  const doc = TERM_DOCS.find((d) => d.id === "term-credit")!;
  const flags: string[] = [];
  if (/연체/.test(ctx.query)) flags.push("연체 이력은 신용점수 하락의 가장 큰 요인입니다. 최우선으로 정리해야 합니다.");
  if (/카드/.test(ctx.query)) flags.push("카드 발급 자체보다 한도 대비 사용률(30% 이하 권장)이 점수에 더 큰 영향을 줍니다.");
  if (/대출/.test(ctx.query)) flags.push("짧은 기간에 여러 곳에 대출을 신청하면 신용조회 이력이 누적되어 불리할 수 있습니다.");
  if (/조회/.test(ctx.query)) flags.push("본인 신용조회는 점수에 영향을 주지 않습니다.");

  const actions = [
    "① 소액이라도 연체를 만들지 않습니다 (자동이체 + 잔액 알림).",
    "② 카드 한도 대비 사용률을 30% 이하로 유지합니다.",
    "③ 주거래 은행을 정해 신용거래 기간을 길게 쌓습니다.",
    "④ 통신비·건강보험료 성실납부 실적을 신용평가사에 제출합니다.",
    "⑤ 현금서비스·카드론은 점수에 불리하므로 마지막 수단으로 둡니다.",
  ];

  return {
    summary: `평가항목 4개 + 개선 행동 ${actions.length}단계`,
    sources: [doc.source],
    data: { kind: "credit", doc, flags, actions },
    facts: `[${doc.term}] ${doc.summary}\n${doc.detail}\n주의: ${doc.caution}\n\n개선 행동:\n${actions.join("\n")}\n${flags.join("\n")}`,
  };
};

const fraudCheck: Handler = (ctx) => {
  const q = ctx.query.toLowerCase();
  const hits = FRAUD_PATTERNS.filter((p) => p.keywords.some((k) => q.includes(k.toLowerCase())));
  const score = Math.min(
    hits.reduce((a, b) => a + b.weight, 0),
    100,
  );
  const level = score >= 60 ? "높음" : score >= 30 ? "주의" : "낮음";

  const facts = [
    `위험 점수: ${score}/100 (${level})`,
    hits.length
      ? `탐지된 위험 신호:\n${hits.map((h) => `- ${h.label}: ${h.why}`).join("\n")}`
      : "명확한 사기 신호는 탐지되지 않았습니다. 다만 확신할 수 없으므로 아래 원칙을 지키세요.",
    `대응 절차:\n${FRAUD_ACTIONS.map((a, i) => `${i + 1}. ${a}`).join("\n")}`,
  ].join("\n\n");

  return {
    summary: `위험 신호 ${hits.length}건 · 위험도 ${level}`,
    sources: ["금융감독원 보이스피싱 지킴이", "경찰청 사이버수사국"],
    data: { kind: "fraud", score, level, hits, actions: FRAUD_ACTIONS },
    facts,
  };
};

/**
 * LH 분양임대공고문 실시간 조회 (공공데이터포털 15058530).
 * 시드 기반 lh_housing_search 와 달리 실제 공고를 가져오지만, 금액 정보는 없다.
 */
const lhNoticeLive: Handler = async (ctx) => {
  const region = String(ctx.params.region ?? "");
  const items = await fetchLhNotices({ region: region || undefined, size: 30 });

  if (items === null) {
    return {
      summary: lhKeyAvailable() ? "LH API 응답 없음" : "LH API 키 미설정",
      sources: ["LH 청약플러스 (공공데이터포털)"],
      data: { kind: "lhNotice", items: [], failed: true },
      facts: lhKeyAvailable()
        ? "LH 실시간 공고 조회에 실패했습니다(응답 지연 또는 오류). 이 사실을 사용자에게 알리고, 공고는 LH 청약플러스에서 직접 확인하도록 안내하세요."
        : "LH 실시간 공고 API 키가 설정되지 않아 조회할 수 없습니다. 이 사실을 사용자에게 알리세요.",
    };
  }

  const open = items.filter((n) => n.status.includes("공고중") || !n.status);
  const list = (open.length ? open : items).slice(0, 6);

  return {
    summary: `실시간 공고 ${items.length}건 중 ${list.length}건`,
    sources: ["LH 청약플러스 (공공데이터포털 실시간 조회)"],
    data: { kind: "lhNotice", items: list },
    facts: [
      noticeFacts(list),
      "주의: 이 API 는 공고 목록만 제공합니다. 보증금·월세·면적·자격요건은 응답에 없으므로 절대 추측하지 말고, 상세 조건은 공고문에서 확인해야 한다고 안내하세요.",
    ].join("\n"),
  };
};

/**
 * 청년 자산형성 제도 매칭 (§34).
 * 자격 판정·중복 규칙·조합 최적화를 전부 코드가 수행한다. LLM 은 설명만 한다.
 */
const youthAssetMatch: Handler = (ctx) => {
  const p = ctx.params;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

  const age = num(p.age) ?? guessAge(ctx.query);
  const personalIncome = num(p.personalIncome) ?? num(p.income) ?? 0;
  const householdMedianPct = num(p.householdMedianPct);
  const monthlyCapacity = num(p.capacity) ?? num(p.monthly) ?? 0;

  if (!age || !personalIncome) {
    return {
      summary: "나이·소득 정보 없음 — 입력 필요",
      sources: ["청년 자산형성 제도 조건표 (2026.09.02 기준)"],
      data: { kind: "youthAsset", needsInput: true },
      facts:
        "가입 자격을 판정하려면 최소한 나이와 개인 연소득이 필요합니다. " +
        "가구 기준중위소득 %와 월 저축 여력도 있으면 정확도가 올라갑니다. 사용자에게 물어보세요. " +
        "임의로 값을 가정해 판정하지 마세요.",
    };
  }

  // 제도명이 "언급"된 것과 "가입 중"인 것은 다르다.
  // "청년도약계좌랑 내일저축계좌 둘 다 되나?" 는 질문이지 기가입 신고가 아니다.
  // 가입 표현이 제도명 근처에 있을 때만 기가입으로 본다.
  const enrolled = detectEnrolled(ctx.query);

  const profile: AssetProfile = {
    age,
    personalIncome,
    householdMedianPct,
    hasEarnedIncome: !/무직|소득 ?없/.test(ctx.query),
    enrolled,
    monthlyCapacity,
  };

  const plan = buildAssetPlan(profile);
  const okCount = plan.verdicts.filter((v) => v.eligible).length;

  return {
    summary: `가입 가능 ${okCount}개 · 예상 정부기여금 ${Math.round(plan.totalBenefit).toLocaleString("ko-KR")}원`,
    sources: [
      "서민금융진흥원 청년미래적금",
      "금융위원회 보도자료",
      "보건복지부 청년내일저축계좌",
      "국회예산정책처 ISA 보고서",
    ],
    data: { kind: "youthAsset", plan, profile },
    facts: planFacts(plan, profile),
    carry: plan.totalMonthly > 0 ? { monthly: plan.totalMonthly } : undefined,
  };
};

/**
 * 이미 가입한 제도를 추출한다.
 * 제도명 뒤 25자 안에 가입 표현이 있거나, 앞에 "이미/기존" 이 붙은 경우만 인정한다.
 * 단순 언급을 기가입으로 오인하면 중복 규칙이 잘못 걸려 가입 가능한 제도가 차단된다.
 */
function detectEnrolled(q: string): string[] {
  const NAMES: [string, RegExp][] = [
    ["leap-account", /청년도약계좌/g],
    ["tomorrow-savings", /(청년)?내일저축계좌/g],
    ["future-savings", /청년미래적금/g],
    ["isa", /\bISA\b/gi],
  ];
  const ENROLLED = /(가입|들고|넣고|유지|납입|붓고|하는 중|중이)/;
  const PRIOR = /(이미|기존에|현재)\s*$/;

  const out: string[] = [];
  for (const [id, re] of NAMES) {
    const rx = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = rx.exec(q)) !== null) {
      const after = q.slice(m.index + m[0].length, m.index + m[0].length + 25);
      const before = q.slice(Math.max(0, m.index - 10), m.index);
      // "가입 가능", "가입할 수" 는 질문이지 기가입이 아니다.
      const asks = /가입\s*(가능|할|하려|되)/.test(after);
      if (!asks && (ENROLLED.test(after) || PRIOR.test(before))) {
        out.push(id);
        break;
      }
    }
  }
  return out;
}

/** "27살", "만 25세" 같은 표기에서 나이를 뽑는다 */
function guessAge(q: string): number | undefined {
  const m = q.match(/(?:만\s*)?([1-9][0-9])\s*(?:세|살)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return n >= 15 && n <= 60 ? n : undefined;
}

export const HANDLERS: Record<string, Handler> = {
  lh_notice_live: lhNoticeLive,
  youth_asset_match: youthAssetMatch,
  sh_housing_search: housingSearch("SH"),
  lh_housing_search: housingSearch("LH"),
  scholarship_search: scholarshipSearch,
  youth_policy_search: youthPolicySearch,
  fin_term_explain: finTermExplain,
  savings_calc: savingsCalc,
  spending_analyze: spendingAnalyze,
  goal_plan: goalPlan,
  tuition_plan: tuitionPlan,
  deposit_compare: depositCompare,
  credit_coach: creditCoach,
  fraud_check: fraudCheck,
};

/** Custom Skill(§21) 은 전용 핸들러가 없으므로 입력 요약만 돌려준다. */
const customFallback = (skill: Skill): Handler => (ctx) => ({
  summary: "사용자 정의 Skill 실행",
  sources: skill.dataSources,
  data: { kind: "custom", skill: skill.id, params: ctx.params },
  facts: `사용자가 정의한 Skill "${skill.name}" 이 실행되었습니다.\n설명: ${skill.description}\n입력: ${JSON.stringify(ctx.params)}\n이 Skill 은 아직 외부 데이터 연결이 없으므로, 입력값과 설명을 근거로만 답하고 확인이 필요한 부분은 명확히 밝히세요.`,
});

export async function runSkill(
  skill: Skill,
  query: string,
  extraParams: Record<string, unknown> = {},
): Promise<SkillResult & { ms: number }> {
  const start = Date.now();
  const handler = HANDLERS[skill.executor.ref] ?? customFallback(skill);
  const params = { ...extractParams(query, skill), ...(extraParams as Record<string, string | number>) };
  const result = await handler({ query, params });
  return { ...result, ms: Date.now() - start };
}
