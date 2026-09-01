import type { Category, FinKit, PersonaProfile, Recipe, SkillType, Axis } from "@/lib/types";

/** README §9 — MVP 는 규칙 기반 Persona 추천 */
export const PERSONAS: PersonaProfile[] = [
  {
    id: "university",
    name: "대학생",
    icon: "🎓",
    summary: "등록금·장학금·주거비를 동시에 고민하는 재학생",
    match: {
      status: ["대학생", "대학원생"],
      interests: ["education", "youth", "housing"],
    },
    defaultAgentName: "나의 대학생활 금융비서",
    defaultInstructions:
      "너는 대학생의 금융생활을 돕는 비서다. 장학금과 청년정책처럼 '먼저 받을 수 있는 돈'을 항상 우선 검토하고, 대출은 마지막 수단으로 안내한다. 금융 전문용어는 반드시 쉬운 말로 바꿔 설명한다.",
  },
  {
    id: "firstjob",
    name: "사회초년생",
    icon: "💼",
    summary: "첫 월급으로 자산 형성을 시작하는 직장인",
    match: {
      status: ["직장인", "사회초년생", "취업준비생"],
      interests: ["wealth", "saving", "credit"],
    },
    defaultAgentName: "첫 월급 관리 비서",
    defaultInstructions:
      "너는 사회초년생의 자산형성을 돕는 비서다. 비상금 확보 → 고정비 점검 → 목표저축 순서로 조언하고, 계산이 필요한 답변은 반드시 계산 Skill 의 결과를 인용한다. 투자 권유는 하지 않는다.",
  },
  {
    id: "living-alone",
    name: "자취생",
    icon: "🏠",
    summary: "주거비 부담이 가장 큰 1인 가구",
    match: {
      housing: ["자취", "원룸", "고시원", "기숙사"],
      interests: ["housing", "spending", "youth"],
    },
    defaultAgentName: "자취 생활비 파트너",
    defaultInstructions:
      "너는 1인 가구의 생활비를 관리하는 파트너다. 주거비를 가장 큰 고정비로 보고 항상 먼저 점검하며, 공공 임대주택과 주거 지원정책을 함께 제안한다.",
  },
  {
    id: "beginner",
    name: "금융초보",
    icon: "🌱",
    summary: "금융 용어부터 차근차근 익히고 싶은 입문자",
    match: {
      knowledge: ["처음이에요", "기초"],
      interests: ["literacy", "security", "saving"],
    },
    defaultAgentName: "금융 첫걸음 도우미",
    defaultInstructions:
      "너는 금융 입문자를 돕는 도우미다. 모든 용어를 처음 듣는다고 가정하고 풀어서 설명하며, 한 번에 하나씩만 안내한다. 금융사기 위험 신호가 보이면 즉시 알려준다.",
  },
];

export const PERSONA_MAP: Record<string, PersonaProfile> = Object.fromEntries(
  PERSONAS.map((p) => [p.id, p]),
);

/** README §8.2 FinKit 예시 */
export const FINKITS: FinKit[] = [
  {
    id: "kit-university",
    name: "대학생 FinKit",
    persona: "university",
    icon: "🎓",
    tagline: "등록금·장학금·주거를 한 번에",
    reason: "재학 중 반복되는 장학금 신청, 등록금 마련, 청년주택 탐색을 하나의 Agent 로 처리할 수 있습니다.",
    skillIds: [
      "scholarship-finder",
      "tuition-loan-planner",
      "youth-policy-search",
      "sh-youth-housing",
      "lh-youth-housing",
      "spending-analyzer",
      "fin-term-explainer",
    ],
  },
  {
    id: "kit-firstjob",
    name: "사회초년생 FinKit",
    persona: "firstjob",
    icon: "💼",
    tagline: "첫 월급부터 자산 형성까지",
    reason: "급여 관리·비상금·예적금·신용관리처럼 사회 진입 직후 1년에 필요한 Skill 을 묶었습니다.",
    skillIds: [
      "youth-asset-match",
      "spending-analyzer",
      "goal-savings-planner",
      "deposit-compare",
      "savings-calculator",
      "credit-coach",
    ],
  },
  {
    id: "kit-living-alone",
    name: "자취생 FinKit",
    persona: "living-alone",
    icon: "🏠",
    tagline: "주거비를 줄이는 가장 빠른 조합",
    reason: "1인 가구 지출의 40% 이상을 차지하는 주거비를 공공주택·주거정책·소비분석으로 함께 공략합니다.",
    skillIds: [
      "sh-youth-housing",
      "lh-youth-housing",
      "youth-policy-search",
      "spending-analyzer",
      "goal-savings-planner",
    ],
  },
  {
    id: "kit-beginner",
    name: "금융초보 FinKit",
    persona: "beginner",
    icon: "🌱",
    tagline: "용어부터 사기 예방까지 기본기",
    reason: "금융 의사결정을 시작하기 전에 필요한 이해·계산·보호 능력을 최소 구성으로 담았습니다.",
    skillIds: [
      "fin-term-explainer",
      "deposit-compare",
      "savings-calculator",
      "fraud-guard",
    ],
  },
];

/** README §15 Skill Recipe */
export const RECIPES: Recipe[] = [
  {
    id: "recipe-independence",
    name: "독립준비 Recipe",
    description: "자취를 시작하기 전 금융상태 점검부터 저축계획까지 한 번에 실행합니다.",
    visibility: "public",
    steps: [
      { skillId: "spending-analyzer", note: "내 금융상태 분석" },
      { skillId: "sh-youth-housing", note: "청년주거 검색" },
      { skillId: "youth-policy-search", note: "지원자격 Match" },
      { skillId: "savings-calculator", note: "예상 주거비 Calculate" },
      { skillId: "deposit-compare", note: "금융상품 Compare" },
      { skillId: "goal-savings-planner", note: "저축계획 Plan" },
    ],
  },
  {
    id: "recipe-tuition",
    name: "이번 학기 등록금 Recipe",
    description: "장학금을 먼저 확보하고 남은 등록금의 자금 계획을 세웁니다.",
    visibility: "public",
    steps: [
      { skillId: "scholarship-finder", note: "지원 가능 장학금 탐색" },
      { skillId: "tuition-loan-planner", note: "실부담 등록금 계산" },
      { skillId: "goal-savings-planner", note: "남은 금액 자금계획" },
    ],
  },
  {
    id: "recipe-firstsalary",
    name: "첫 월급 Recipe",
    description: "첫 급여를 받은 달에 해야 할 일을 순서대로 실행합니다.",
    visibility: "public",
    steps: [
      { skillId: "spending-analyzer", note: "지출 구조 분석" },
      { skillId: "goal-savings-planner", note: "비상금 목표 수립" },
      { skillId: "deposit-compare", note: "적금 상품 비교" },
      { skillId: "savings-calculator", note: "만기 수령액 확인" },
    ],
  },
];

/* ---------------- Taxonomy 라벨 & 매핑 (README §6) ---------------- */

export const CATEGORY_LABEL: Record<Category, string> = {
  wealth: "자산형성",
  saving: "저축",
  invest: "투자",
  credit: "대출/신용",
  spending: "소비",
  housing: "주거",
  education: "교육/장학",
  youth: "청년정책",
  security: "금융보안",
  literacy: "금융상식",
};

export const TYPE_LABEL: Record<SkillType, string> = {
  search: "Search",
  match: "Match",
  compare: "Compare",
  explain: "Explain",
  calculate: "Calculate",
  analyze: "Analyze",
  plan: "Plan",
  protect: "Protect",
  action: "Action",
};

export const TYPE_TO_AXIS: Record<SkillType, Axis> = {
  search: "FIND",
  match: "FIND",
  compare: "FIND",
  explain: "UNDERSTAND",
  calculate: "UNDERSTAND",
  analyze: "MANAGE",
  plan: "MANAGE",
  protect: "PROTECT",
  action: "PROTECT",
};

export const AXIS_LABEL: Record<Axis, string> = {
  FIND: "금융기회를 찾는 능력",
  UNDERSTAND: "금융정보를 이해하는 능력",
  MANAGE: "금융생활을 관리하는 능력",
  PROTECT: "금융생활을 보호하는 능력",
};

export const ONBOARDING_OPTIONS = {
  age: ["19~22세", "23~26세", "27~29세", "30세 이상"],
  status: ["대학생", "대학원생", "취업준비생", "사회초년생", "직장인", "프리랜서"],
  region: ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "그 외"],
  housing: ["부모님과 거주", "자취", "기숙사", "고시원", "전세", "자가"],
  knowledge: ["처음이에요", "기초", "어느 정도 알아요", "잘 알아요"],
} as const;
