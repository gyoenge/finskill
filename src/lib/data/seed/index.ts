/**
 * 시드 데이터 (청년정책·LH·장학금 등)
 *
 * 실제 SH/LH/장학재단/온통청년 API 를 붙이기 전까지 사용하는 목업 데이터셋이다.
 * 구조는 각 기관 공고의 실제 필드를 따랐으므로, executor 의 fetch 부분만 교체하면
 * 나머지 라우팅·Trace·Passport 로직은 그대로 동작한다.
 */

export interface HousingListing {
  id: string;
  agency: "SH" | "LH";
  title: string;
  region: string;
  type: string;
  deposit: number; // 만원
  monthlyRent: number; // 만원
  area: string;
  applyFrom: string;
  applyTo: string;
  eligibility: string[];
  url: string;
}

export const HOUSING: HousingListing[] = [
  {
    id: "sh-2026-08-01",
    agency: "SH",
    title: "2026년 3차 청년안심주택 (역세권) 입주자 모집",
    region: "서울 관악구",
    type: "역세권 청년주택",
    deposit: 900,
    monthlyRent: 32,
    area: "전용 19~24㎡",
    applyFrom: "2026.09.07",
    applyTo: "2026.09.18",
    eligibility: ["만 19~39세", "무주택자", "월평균소득 120% 이하", "자동차가액 기준 충족"],
    url: "https://www.i-sh.co.kr/",
  },
  {
    id: "sh-2026-08-02",
    agency: "SH",
    title: "2026년 청년 매입임대주택 2차 입주자 모집",
    region: "서울 동작구",
    type: "청년 매입임대",
    deposit: 400,
    monthlyRent: 21,
    area: "전용 16~29㎡",
    applyFrom: "2026.09.01",
    applyTo: "2026.09.12",
    eligibility: ["만 19~39세 무주택 청년", "1순위: 생계·의료급여 수급가구", "대학생·취업준비생 포함"],
    url: "https://www.i-sh.co.kr/",
  },
  {
    id: "sh-2026-08-03",
    agency: "SH",
    title: "행복주택 (대학생·청년 계층) 예비입주자 모집",
    region: "서울 노원구",
    type: "행복주택",
    deposit: 1800,
    monthlyRent: 18,
    area: "전용 26~36㎡",
    applyFrom: "2026.09.14",
    applyTo: "2026.09.25",
    eligibility: ["대학생·청년·신혼부부", "무주택 세대구성원", "소득 100% 이하"],
    url: "https://www.i-sh.co.kr/",
  },
  {
    id: "sh-2026-08-04",
    agency: "SH",
    title: "청년안심주택 (민간임대) 잔여세대 수시모집",
    region: "서울 성동구",
    type: "역세권 청년주택",
    deposit: 2500,
    monthlyRent: 45,
    area: "전용 20~30㎡",
    applyFrom: "2026.08.20",
    applyTo: "2026.09.30",
    eligibility: ["만 19~39세", "무주택자", "소득 제한 완화 세대"],
    url: "https://www.i-sh.co.kr/",
  },
  {
    id: "lh-2026-08-01",
    agency: "LH",
    title: "2026년 3차 청년 매입임대주택 입주자 모집",
    region: "경기 성남시",
    type: "청년 매입임대",
    deposit: 300,
    monthlyRent: 19,
    area: "전용 18~30㎡",
    applyFrom: "2026.09.02",
    applyTo: "2026.09.16",
    eligibility: ["만 19~39세 무주택 청년", "1순위: 수급가구·차상위", "2순위: 소득 100% 이하", "3순위: 소득 150% 이하"],
    url: "https://apply.lh.or.kr/",
  },
  {
    id: "lh-2026-08-02",
    agency: "LH",
    title: "청년 전세임대 (수시) 입주대상자 모집",
    region: "전국",
    type: "청년 전세임대",
    deposit: 200,
    monthlyRent: 14,
    area: "전용 60㎡ 이하 (본인 물색)",
    applyFrom: "2026.08.01",
    applyTo: "2026.12.31",
    eligibility: ["만 19~39세", "무주택", "지원한도 수도권 1.2억 / 광역시 9.5천만 / 그 외 8.5천만"],
    url: "https://apply.lh.or.kr/",
  },
  {
    id: "lh-2026-08-03",
    agency: "LH",
    title: "기숙사형 청년주택 입주자 모집",
    region: "서울 서대문구",
    type: "기숙사형 청년주택",
    deposit: 100,
    monthlyRent: 12,
    area: "1인실 / 셰어형",
    applyFrom: "2026.09.05",
    applyTo: "2026.09.19",
    eligibility: ["대학생·취업준비생", "만 19~39세", "무주택", "타 지역 출신 우선"],
    url: "https://apply.lh.or.kr/",
  },
  {
    id: "lh-2026-08-04",
    agency: "LH",
    title: "청년 매입임대 (지방권) 추가 모집",
    region: "부산 부산진구",
    type: "청년 매입임대",
    deposit: 250,
    monthlyRent: 16,
    area: "전용 20~33㎡",
    applyFrom: "2026.09.08",
    applyTo: "2026.09.22",
    eligibility: ["만 19~39세 무주택 청년", "소득 100% 이하 우선"],
    url: "https://apply.lh.or.kr/",
  },
];

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: string;
  deadline: string;
  incomeLevel: number | null; // 소득분위 상한
  grades: string[];
  majors: string[];
  region: string;
  conditions: string[];
  url: string;
}

export const SCHOLARSHIPS: Scholarship[] = [
  {
    id: "sch-nation-1",
    name: "국가장학금 I유형",
    provider: "한국장학재단",
    amount: "학기당 최대 260만원",
    deadline: "2026.09.20",
    incomeLevel: 8,
    grades: ["1학년", "2학년", "3학년", "4학년"],
    majors: ["전체"],
    region: "전국",
    conditions: ["소득 8분위 이하", "직전 학기 성적 80점 이상", "12학점 이상 이수"],
    url: "https://www.kosaf.go.kr/",
  },
  {
    id: "sch-nation-2",
    name: "국가우수장학금 (이공계)",
    provider: "한국장학재단",
    amount: "등록금 전액 + 학업장려비",
    deadline: "2026.09.15",
    incomeLevel: null,
    grades: ["1학년", "2학년"],
    majors: ["공학", "자연과학", "이공"],
    region: "전국",
    conditions: ["이공계 학과 재학", "성적 B0 이상", "타 전액장학금과 중복 불가"],
    url: "https://www.kosaf.go.kr/",
  },
  {
    id: "sch-work",
    name: "국가근로장학금",
    provider: "한국장학재단",
    amount: "시급 기준 월 최대 60만원",
    deadline: "2026.09.10",
    incomeLevel: 8,
    grades: ["1학년", "2학년", "3학년", "4학년"],
    majors: ["전체"],
    region: "전국",
    conditions: ["소득 8분위 이하", "성적 70점 이상", "교내외 근로 참여"],
    url: "https://www.kosaf.go.kr/",
  },
  {
    id: "sch-seoul-youth",
    name: "서울시 대학생 학자금 이자지원",
    provider: "서울특별시",
    amount: "학자금대출 이자 전액",
    deadline: "2026.09.30",
    incomeLevel: 8,
    grades: ["1학년", "2학년", "3학년", "4학년"],
    majors: ["전체"],
    region: "서울",
    conditions: ["서울시 거주 (본인 또는 부모)", "학자금대출 실행자"],
    url: "https://youth.seoul.go.kr/",
  },
  {
    id: "sch-private-1",
    name: "삼성드림클래스 장학",
    provider: "민간재단",
    amount: "연 400만원",
    deadline: "2026.09.25",
    incomeLevel: 6,
    grades: ["2학년", "3학년"],
    majors: ["전체"],
    region: "전국",
    conditions: ["소득 6분위 이하", "봉사활동 이력", "추천서 필요"],
    url: "https://www.kosaf.go.kr/",
  },
  {
    id: "sch-private-2",
    name: "청년 자립 지원 장학금",
    provider: "민간재단",
    amount: "학기당 150만원",
    deadline: "2026.10.05",
    incomeLevel: 5,
    grades: ["1학년", "2학년", "3학년", "4학년"],
    majors: ["전체"],
    region: "전국",
    conditions: ["소득 5분위 이하", "자취 또는 독립생계", "면접 심사"],
    url: "https://www.kosaf.go.kr/",
  },
];

export interface YouthPolicy {
  id: string;
  name: string;
  agency: string;
  topic: "주거" | "자산형성" | "취업" | "교육" | "생활";
  region: string;
  benefit: string;
  deadline: string;
  eligibility: string[];
  url: string;
}

export const YOUTH_POLICIES: YouthPolicy[] = [
  {
    id: "pol-rent",
    name: "청년월세 한시 특별지원",
    agency: "국토교통부",
    topic: "주거",
    region: "전국",
    benefit: "월 최대 20만원 × 12개월",
    deadline: "2026.12.31",
    eligibility: ["만 19~34세", "부모와 별도 거주", "보증금 5천만원 이하 및 월세 60만원 이하", "청년 가구 중위소득 60% 이하"],
    url: "https://www.myhome.go.kr/",
  },
  {
    id: "pol-seoul-rent",
    name: "서울시 청년월세지원",
    agency: "서울특별시",
    topic: "주거",
    region: "서울",
    benefit: "월 20만원 × 최대 10개월",
    deadline: "2026.09.19",
    eligibility: ["서울 거주 만 19~39세", "임차보증금 8천만원 이하", "기준 중위소득 150% 이하", "국토부 월세지원과 중복 불가"],
    url: "https://youth.seoul.go.kr/",
  },
  {
    id: "pol-doyak",
    name: "청년도약계좌",
    agency: "금융위원회",
    topic: "자산형성",
    region: "전국",
    benefit: "5년 만기, 정부기여금 + 비과세",
    deadline: "상시 (매월 신청기간)",
    eligibility: ["만 19~34세", "총급여 7,500만원 이하", "가구소득 중위 250% 이하"],
    url: "https://www.fsc.go.kr/",
  },
  {
    id: "pol-naeil",
    name: "청년내일저축계좌",
    agency: "보건복지부",
    topic: "자산형성",
    region: "전국",
    benefit: "본인 10만원 저축 시 정부 10~30만원 지원 (3년)",
    deadline: "2026.09.12",
    eligibility: ["만 19~34세 근로 청년", "기준 중위소득 100% 이하", "근로·사업소득 발생"],
    url: "https://www.bokjiro.go.kr/",
  },
  {
    id: "pol-deposit-loan",
    name: "청년전용 버팀목전세자금대출",
    agency: "주택도시기금",
    topic: "주거",
    region: "전국",
    benefit: "최대 2억원, 금리 연 1.8~2.7%",
    deadline: "상시",
    eligibility: ["만 19~34세 무주택 세대주", "연소득 5천만원 이하", "순자산 기준 충족"],
    url: "https://nhuf.molit.go.kr/",
  },
  {
    id: "pol-job",
    name: "국민취업지원제도 (청년 특례)",
    agency: "고용노동부",
    topic: "취업",
    region: "전국",
    benefit: "구직촉진수당 월 50만원 × 6개월 + 취업지원 서비스",
    deadline: "상시",
    eligibility: ["만 15~34세", "가구소득 중위 120% 이하", "재산 5억원 이하"],
    url: "https://www.kua.go.kr/",
  },
  {
    id: "pol-seoul-life",
    name: "서울 청년수당",
    agency: "서울특별시",
    topic: "생활",
    region: "서울",
    benefit: "월 50만원 × 최대 6개월",
    deadline: "2026.09.30",
    eligibility: ["서울 거주 만 19~34세 미취업 청년", "중위소득 150% 이하", "졸업 후 2년 경과"],
    url: "https://youth.seoul.go.kr/",
  },
];

export interface DepositProduct {
  id: string;
  bank: string;
  name: string;
  kind: "적금" | "예금";
  baseRate: number;
  maxRate: number;
  months: number[];
  maxMonthly: number | null; // 만원
  conditions: string[];
  joinWay: string;
}

export const DEPOSITS: DepositProduct[] = [
  { id: "dep-1", bank: "케이뱅크", name: "코드K 자유적금", kind: "적금", baseRate: 3.3, maxRate: 3.8, months: [6, 12, 24, 36], maxMonthly: 300, conditions: ["자동이체 등록", "마케팅 동의"], joinWay: "비대면" },
  { id: "dep-2", bank: "카카오뱅크", name: "26주적금", kind: "적금", baseRate: 2.9, maxRate: 7.0, months: [6], maxMonthly: 30, conditions: ["26주 연속 납입 성공", "증액식 납입"], joinWay: "비대면" },
  { id: "dep-3", bank: "우리은행", name: "우리 첫거래 적금", kind: "적금", baseRate: 3.0, maxRate: 5.5, months: [12], maxMonthly: 50, conditions: ["첫 거래 고객", "급여이체 실적", "카드 사용 실적"], joinWay: "비대면/영업점" },
  { id: "dep-4", bank: "신한은행", name: "청년 처음적금", kind: "적금", baseRate: 3.1, maxRate: 4.6, months: [12, 24], maxMonthly: 50, conditions: ["만 19~39세", "신한 첫 적금"], joinWay: "비대면" },
  { id: "dep-5", bank: "토스뱅크", name: "먼저 이자 받는 예금", kind: "예금", baseRate: 3.0, maxRate: 3.2, months: [3, 6, 12], maxMonthly: null, conditions: ["가입 즉시 이자 지급"], joinWay: "비대면" },
  { id: "dep-6", bank: "국민은행", name: "KB 청년도약 정기예금", kind: "예금", baseRate: 3.15, maxRate: 3.45, months: [12, 24], maxMonthly: null, conditions: ["만 19~34세", "비대면 가입"], joinWay: "비대면" },
];

export interface TermDoc {
  id: string;
  term: string;
  aliases: string[];
  summary: string;
  detail: string;
  caution: string;
  source: string;
}

/** RAG Skill 용 공식 문서 코퍼스 (요약본) */
export const TERM_DOCS: TermDoc[] = [
  {
    id: "term-isa",
    term: "ISA (개인종합자산관리계좌)",
    aliases: ["isa", "개인종합자산관리계좌", "만능통장"],
    summary: "예금·펀드·ETF 등을 한 계좌에 담고, 계좌 전체의 순이익에 세제혜택을 주는 절세 계좌입니다.",
    detail:
      "의무가입기간은 3년이며, 일반형은 순이익 200만원(서민형 400만원)까지 비과세, 초과분은 9.9% 분리과세됩니다. 연간 납입한도는 2천만원, 총 납입한도는 1억원입니다. 계좌 안의 상품끼리 손익을 합산해 세금을 매기는 점이 일반 계좌와의 가장 큰 차이입니다.",
    caution: "의무가입기간(3년) 전에 해지하면 받은 세제혜택이 추징됩니다. 원금이 보장되는 상품이 아닙니다.",
    source: "금융감독원 파인 / 금융위원회",
  },
  {
    id: "term-dsr",
    term: "DSR (총부채원리금상환비율)",
    aliases: ["dsr", "총부채원리금상환비율"],
    summary: "1년에 갚아야 하는 모든 대출의 원금과 이자가 연소득에서 차지하는 비율입니다.",
    detail:
      "DSR = (모든 대출의 연간 원리금 상환액 ÷ 연소득) × 100 으로 계산합니다. 주택담보대출뿐 아니라 신용대출, 학자금대출, 카드론까지 포함합니다. 은행권은 통상 DSR 40% 규제를 적용하므로, 소득 대비 이미 갚고 있는 빚이 많으면 추가 대출 한도가 줄어듭니다.",
    caution: "DSR 은 '한도 규제' 지표이지 상환 능력을 보장하는 값이 아닙니다.",
    source: "금융감독원 / 금융위원회 가계부채 관리방안",
  },
  {
    id: "term-cheongyak",
    term: "주택청약종합저축",
    aliases: ["청약", "청약통장", "주택청약"],
    summary: "아파트 분양에 신청할 자격을 만들기 위해 매달 넣는 통장입니다. 적금과 목적이 다릅니다.",
    detail:
      "매월 2만원~50만원을 자유롭게 납입하며, 납입 횟수와 인정 금액이 청약 순위를 결정합니다. 국민주택은 납입 횟수, 민영주택은 지역별 예치금 기준을 봅니다. 무주택 세대주이고 총급여 요건을 충족하면 연 300만원 한도로 납입액의 40% 소득공제를 받을 수 있습니다.",
    caution: "이자만 보면 일반 적금보다 불리할 수 있습니다. 청약 자격 확보가 주된 목적입니다.",
    source: "국토교통부 / 주택도시기금",
  },
  {
    id: "term-compound",
    term: "단리와 복리",
    aliases: ["단리", "복리", "이자 계산"],
    summary: "단리는 원금에만 이자가 붙고, 복리는 이자에도 다시 이자가 붙습니다.",
    detail:
      "적금의 표시 금리는 대부분 '연 단리'이며, 매달 납입한 돈이 각각 남은 개월 수만큼만 이자를 받습니다. 그래서 월 30만원 × 12개월 연 3.5% 적금의 실제 이자는 원금 360만원의 3.5%가 아니라 약 절반 수준입니다.",
    caution: "적금 광고의 금리는 '연 이율'이지 만기 수익률이 아닙니다.",
    source: "한국은행 경제용어사전 / 은행연합회",
  },
  {
    id: "term-credit",
    term: "신용점수",
    aliases: ["신용점수", "신용등급", "nice", "kcb"],
    summary: "개인이 빌린 돈을 약속대로 갚을 가능성을 1~1000점으로 평가한 값입니다.",
    detail:
      "평가 항목은 상환이력(약 30%), 부채수준(약 25%), 신용거래기간(약 13%), 신용형태(약 30%)로 구성됩니다. 연체는 가장 큰 하락 요인이며, 소액이라도 5영업일 이상 연체하면 기록이 남습니다. 통신비·건강보험료 성실납부 실적은 가점 요소로 제출할 수 있습니다.",
    caution: "본인 신용조회는 점수에 영향을 주지 않습니다. 다만 짧은 기간의 반복적인 대출 신청은 영향을 줄 수 있습니다.",
    source: "금융감독원 파인 / NICE평가정보·KCB 안내자료",
  },
  {
    id: "term-jeonse",
    term: "전세와 월세",
    aliases: ["전세", "월세", "보증금", "반전세"],
    summary: "전세는 큰 보증금을 맡기고 월 임대료를 내지 않는 방식, 월세는 작은 보증금에 매달 임대료를 내는 방식입니다.",
    detail:
      "전세는 목돈이 묶이지만 월 고정지출이 낮고, 월세는 초기 부담이 작지만 매달 현금이 나갑니다. 전세는 보증금 미반환 위험이 있으므로 확정일자와 전입신고로 대항력과 우선변제권을 확보하고, 전세보증금 반환보증 가입을 검토해야 합니다.",
    caution: "등기부등본의 선순위 채권(근저당)을 확인하지 않으면 보증금을 돌려받지 못할 수 있습니다.",
    source: "국토교통부 / 주택도시보증공사(HUG)",
  },
  {
    id: "term-emergency",
    term: "비상금",
    aliases: ["비상금", "비상자금", "예비자금"],
    summary: "실직·사고처럼 예상치 못한 일이 생겼을 때 빚을 지지 않고 버티기 위한 돈입니다.",
    detail:
      "일반적으로 월 고정지출의 3~6개월치를 권장합니다. 수익률보다 '언제든 꺼낼 수 있는가'가 중요하므로 파킹통장이나 수시입출금 예금처럼 유동성이 높은 곳에 둡니다.",
    caution: "비상금을 투자상품에 넣으면 정작 필요할 때 손실 상태로 팔아야 할 수 있습니다.",
    source: "금융감독원 금융교육센터",
  },
  {
    id: "term-studentloan",
    term: "학자금대출 (취업 후 상환)",
    aliases: ["학자금대출", "취업후상환", "든든학자금", "일반상환"],
    summary: "등록금과 생활비를 빌리고, 취업해 일정 소득이 생긴 뒤부터 갚는 제도입니다.",
    detail:
      "취업 후 상환 학자금대출(ICL)은 연간 소득이 상환기준소득을 넘는 시점부터 소득의 일정 비율을 원천징수 방식으로 갚습니다. 일반 상환 학자금대출은 거치기간과 상환기간이 정해져 있고 재학 중에도 이자가 발생합니다. 소득분위·학년에 따라 이용 가능 여부가 달라집니다.",
    caution: "대출은 장학금·지원금을 모두 확인한 뒤 마지막으로 검토하는 것이 좋습니다.",
    source: "한국장학재단",
  },
];

export interface FraudPattern {
  id: string;
  label: string;
  keywords: string[];
  weight: number;
  why: string;
}

export const FRAUD_PATTERNS: FraudPattern[] = [
  { id: "f-lowrate", label: "저금리 대환대출 유인", keywords: ["저금리", "대환", "대환대출", "정부지원 대출", "햇살론 승인"], weight: 30, why: "제도권 금융회사는 문자로 먼저 대출을 권유하지 않습니다." },
  { id: "f-app", label: "앱 설치 요구", keywords: ["앱 설치", "apk", "설치하시면", "링크 클릭", "url 접속"], weight: 30, why: "원격제어·악성 앱 설치는 계좌 탈취의 대표적 수법입니다." },
  { id: "f-urgent", label: "긴급성 압박", keywords: ["오늘까지", "즉시", "긴급", "마감 임박", "지금 바로", "곧 정지"], weight: 15, why: "판단할 시간을 주지 않는 것은 사기의 공통 특징입니다." },
  { id: "f-agency", label: "기관 사칭", keywords: ["검찰", "경찰", "금융감독원", "수사", "구속", "명의도용", "국세청"], weight: 30, why: "수사기관과 금감원은 전화·문자로 계좌이체나 앱 설치를 요구하지 않습니다." },
  { id: "f-transfer", label: "송금·계좌 요구", keywords: ["안전계좌", "송금", "입금", "계좌번호", "보관", "이체"], weight: 35, why: "'안전계좌'라는 제도는 존재하지 않습니다." },
  { id: "f-personal", label: "개인정보 요구", keywords: ["주민등록번호", "otp", "보안카드", "비밀번호", "인증번호", "카드번호"], weight: 35, why: "인증번호·보안카드를 요구하면 100% 사기입니다." },
  { id: "f-highreturn", label: "고수익 보장", keywords: ["원금보장", "수익률", "확정 수익", "리딩방", "코인 추천", "선물거래"], weight: 30, why: "원금과 수익을 동시에 보장하는 합법 금융상품은 없습니다." },
];

export const FRAUD_ACTIONS = [
  "즉시 통화·메시지를 중단하고 상대가 보낸 링크와 앱을 절대 실행하지 않습니다.",
  "이미 송금했다면 해당 은행 콜센터 또는 112 로 즉시 '지급정지'를 요청합니다.",
  "금융감독원 1332 (☎ 국번없이 1332) 로 상담하고 피해 사실을 신고합니다.",
  "악성 앱 설치가 의심되면 휴대폰을 비행기모드로 전환하고 다른 기기로 연락합니다.",
  "계좌정보 통합관리서비스(어카운트인포)에서 본인 명의 계좌·대출 개설 여부를 확인합니다.",
];
