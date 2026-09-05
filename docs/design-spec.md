# 20FIN — 서비스 설계 문서

> **20대의 다음을 준비하는 AI 금융 Agent**
> Life Event를 이해하고, 필요한 금융정보와 행동을 필요한 순간에.

---

## 목차

1. [서비스 개요](#1-서비스-개요)
2. [해결하려는 문제](#2-해결하려는-문제)
3. [핵심 컨셉 — Event-driven Finance](#3-핵심-컨셉--event-driven-finance)
4. [3가지 핵심 기능](#4-3가지-핵심-기능)
5. [UX 핵심 원칙](#5-ux-핵심-원칙)
6. [정보 구조(IA)와 화면](#6-정보-구조ia와-화면)
7. [Life Event & Fin Event 모델](#7-life-event--fin-event-모델)
8. [Agent 아키텍처](#8-agent-아키텍처)
9. [데이터 모델](#9-데이터-모델)
10. [API](#10-api)
11. [디자인 시스템](#11-디자인-시스템)
12. [MVP 범위 & 우선순위](#12-mvp-범위--우선순위)
13. [Demo 시나리오](#13-demo-시나리오)
14. [서비스 원칙 요약](#14-서비스-원칙-요약)

---

## 1. 서비스 개요

### 서비스명 — **20FIN** (20s + Finance)

20대에 연속적으로 발생하는 대학·졸업·취업·첫 월급·학자금대출·독립·자산형성 등의 **Life Event를 시간축으로 이해**하고, 각 시점에 필요한 금융정보와 행동을 선제적으로 제공하는 AI 금융 웹서비스.

### 한 문장 정의

> **20FIN은 20대의 Life Event를 Financial Action으로 변환하는 Timeline-aware AI 금융 Agent다.**

### 핵심 메시지

| 구분 | 카피 |
| --- | --- |
| Main | 20대의 다음을 준비하는 금융. |
| Sub | 지금까지의 이야기와 앞으로의 계획을 알려주세요. 20FIN이 필요한 금융정보와 행동을 가장 필요한 순간에 챙겨드립니다. |
| Brand Line | My 20s, Better Finance. / Finance for what's next. |

---

## 2. 해결하려는 문제

20대는 금융 경험이 축적되기 전에 여러 경제적 사건을 **처음** 경험한다.

```text
대학 입학 → 아르바이트 → 학자금대출 → 취업 준비 → 첫 취업
→ 첫 월급 → 첫 신용카드 → 저축 → 독립 → 전·월세 계약 → 대출/투자/자산형성
```

기존 금융서비스는 **현재 상태(Snapshot)** 분석에 집중한다.

```text
현재 소득 · 소비 · 자산 · 부채  →  금융상품 추천 / 소비 분석
```

그러나 20대에게 더 중요한 것은 **시간적 맥락**이다 — 언제 졸업하는가, 첫 월급은 언제인가, 독립 계획이 있는가, 학자금 상환이 예정되어 있는가.

### 핵심 문제 정의

> 20대는 경제생활의 변화가 빠르게 발생하지만, 각 Life Event에 필요한 금융정보와 행동을 **언제 준비해야 하는지는 스스로 찾아야 한다.**

---

## 3. 핵심 컨셉 — Event-driven Finance

20FIN은 금융상품에서 출발하지 않는다.

```text
기존:   금융상품 → 조건 확인 → 추천
20FIN:  Life Event → Fin Event → Right Timing → Financial Action
```

$$\boxed{Life\ Event \rightarrow Fin\ Event \rightarrow Right\ Timing \rightarrow Financial\ Action}$$

### 차별화

| 기존 금융 서비스 | 20FIN |
| --- | --- |
| Current Snapshot | **Past–Now–Next Timeline** |
| 금융상품 중심 | **Life Event 중심** |
| 사용자가 검색 | **AI가 먼저 탐색** |
| 조건 기반 추천 | **Context + Timing 기반** |
| 일회성 추천 | **지속적인 Timeline 관리** |
| Reactive | **Anticipatory** |
| 금융정보 제공 | **Next Action 제공** |

---

## 4. 3가지 핵심 기능

사용자에게 노출되는 기능은 최대한 단순하게 유지한다.

| 기능 | 답하는 질문 |
| --- | --- |
| ① 나의 20대 Timeline | 앞으로 어떤 일이 있나요? |
| ② 지금 챙길 것 (Right Now) | 지금 무엇을 해야 하나요? — 가장 중요한 행동 1~3개만 선별 |
| ③ AI에게 물어보기 | 내 상황에서는 어떻게 하는 게 좋나요? — Timeline Context를 이미 아는 Agent |

---

## 5. UX 핵심 원칙

1. **Timeline First** — 대시보드가 아니라 Timeline 자체가 메인 UI. (Timeline 70% / Right Now Panel 30%)
2. **Finance보다 Life 먼저** — 월소득·자산·신용점수·투자성향을 처음부터 묻지 않는다. 삶의 Event를 먼저 입력받고, 금융정보는 **Progressive Profiling**으로 이후 요청.
3. **한 화면에는 하나의 질문** — 각 화면은 하나의 질문에만 답한다.
4. **정보량 최소화** — 100개의 금융정보가 있어도 홈에서는 가장 중요한 1~3개만 보여준다. (핵심 가치 = 정보 Filtering)

---

## 6. 정보 구조(IA)와 화면

### Primary Navigation

```text
20FIN
● 나의 20대
○ 지금의 기회
○ AI에게 물어보기
──────────
내 정보 · 설정
```

> 기존 메뉴(FinKit·금융 캘린더·스킬샵·나의 스킬·리포트)는 독립 메뉴로 노출하지 않고 Timeline·Event Detail 내부 기능으로 전환한다.

### 화면 1 — Onboarding (현재 상태)

최소 정보만 입력: **현재 나이 / 현재 상태**(대학생·취업준비·직장인·프리랜서·기타) / **현재 거주**(본가·기숙사·자취·기타).
CTA: **내 20대 그리기**

### 화면 2 — Timeline Onboarding

> **당신의 20대를 그려주세요.** 지금까지 있었던 일과 앞으로 계획하고 있는 일을 추가해주세요. 정확한 날짜를 몰라도 괜찮아요.

- Timeline 범위: 기본 **현재 나이 ± 5년** (좌우 Scroll 가능)
- 미래 Event 상태: `✓ 확정` / `◇ 예상` / `☆ 목표`

**Life Event Category**

| 🎓 Education | 💼 Career | 🏠 Living | 💰 Money | 🎯 Goal |
| --- | --- | --- | --- | --- |
| 대학입학·휴학·복학·졸업·대학원·자격증·유학 | 아르바이트·인턴·취업·이직·퇴사·프리랜스·창업 | 독립·자취·이사·전세·월세·기숙사·해외거주 | 첫 월급·학자금대출·첫 신용카드·대출·저축시작·투자시작 | 목돈·독립자금·유학·여행·자동차·기타 |

**Progressive Profiling** — Event가 필요로 할 때만 관련 정보를 추가 질문한다. (예: 학자금대출 잔액 구간, 독립 주거 형태) 금융정보를 먼저 요구하지 않는다.

**첫 Aha Moment** — 입력을 완료하면 AI가 Life Event를 기반으로 Fin Event(금융 체크포인트)를 자동 생성한다.

```text
입력한 Life Event                자동 생성 Fin Event (예)
2023 대학 입학                    2026.11 ◆ 학자금 상태 점검
2024 학자금대출          →       2027.03 ◆ 취업지원 확인
2027.02 졸업                     2027.09 ◆ 첫 월급 관리 시작
2027.08 취업 목표                2028.01 ◆ 독립 준비 시작
2028.03 독립 목표
```

### 화면 3 — Home / 나의 20대 (메인)

```text
┌────────┬────────────────────────┬──────────────┐
│Sidebar │   나의 20대 Timeline   │ 지금 챙길 것 │
│ 200px  │       flexible          │  320~360px   │
└────────┴────────────────────────┴──────────────┘
```

- **Header**: `안녕하세요, 지민님! 👋 / 25세 · 취업 준비 중` — Dashboard KPI(FinKit 수·금융점수 등)는 노출하지 않는다.
- **Timeline UI**: 직선보다 부드러운 Path 형태. `◎ 지금, 여기`를 가장 강하게 강조.

  ```text
  PAST                     NOW                     NEXT
  ●────────●────────●────────◎────────●────────●
  대학입학  학자금   인턴     지금      졸업예정  독립목표
  ```

- **Timeline Action**: `[ + 새로운 Event 추가 ]`, 보조로 `연도별 보기 / 전체 보기`. Event는 Drag/Edit 가능.
- **Right Now Panel** (오른쪽, 지금 중요한 것만):
  - **지금, 이것만 챙기세요** — 우선 행동 (최대 3개 Carousel)
  - **곧 다가와요** — D-day (예: `D-12 학자금 상환일 2026.09.28`)
  - **놓치면 아까워요** — Opportunity 단 1개만 노출
- **Upcoming Events** (하단, 선택): 가장 가까운 미래 Event 3개 + 준비도(%)

### 화면 4 — Event Detail (Right Drawer)

Timeline Event 클릭 시 새 페이지가 아닌 **Right Drawer**(모바일은 Bottom Sheet)를 연다.

- **Event Readiness**: 전체 금융점수가 아닌 **Life Event별 준비도**. 세부 dimension별 점수와 가장 부족한 부분을 제시.

  ```text
  독립 Readiness — 보증금 60% · 현금흐름 82% · 비상자금 40% · 정책확인 100% · 계약준비 50%
  → 현재 가장 부족한 부분은 '비상자금'이에요.
  ```

- **Checklist**: 완료(✓)/진행(→)/미완(○)
- **20FIN Insight**: 예) "독립까지 7개월 남았습니다. 현재 계획 유지 시 약 320만원이 추가로 필요합니다."
- **맞춤 기회**: 관련 정책 노출
- **AI 연결**: `[ 피오에게 독립 계획 물어보기 🐥 ]` — Event Context 자동 전달

### 화면 5 — 지금의 기회

> **지금의 기회** — 20FIN이 내 Timeline과 상황을 기준으로 필요한 금융정보를 찾았어요.

AI Filtering 자체를 UX로 보여준다.

```text
새로운 금융정보 128개 확인
  ↓ 나이/상태 · 지역 · Life Event · 신청기간 · 지금 필요한가
현재 확인할 정보 3개
```

**Opportunity Card**: 제목 · 관련성 · 신청 D-day · **왜 추천했나요?**(조건 매칭 근거) · `자세히 보기`

### 화면 6 — AI Agent (피오)

역할: **Timeline-aware Financial Agent** (빈 Chat UI가 아님)

```text
🐥 피오 — 지민님의 Timeline을 알고 있어요. 지금 무엇이 궁금한가요?
추천 질문: [독립하려면 얼마?] [첫 월급 배분?] [받을 수 있는 청년지원?] [학자금부터 갚을까?]
```

**Decision UI** — 결과를 긴 문장으로만 출력하지 않고 구조화한다.

```text
20FIN Recommendation (월 가용 70만원 기준)
추천: 저축 30만원 + 학자금 상환 40만원
```

| 전략 | 저축 | 상환 | 특징 |
| --- | --: | --: | --- |
| 저축 우선 | 70만 | 0 | 현금 확보 |
| 균형 | 30만 | 40만 | **추천** |
| 상환 우선 | 0 | 70만 | 부채 빠른 감소 |

**Why**: ① 2028년 독립 목표 ② 비상자금 부족 ③ 학자금 동시 감소.
CTA: `[ Timeline 계획에 반영 ] [ 조건 바꿔보기 ]`

---

## 7. Life Event & Fin Event 모델

- **Life Event** — 사용자가 입력한 삶의 변화 (● 졸업·취업·독립·유학)
- **Fin Event** — 20FIN이 자동 생성한 금융 체크포인트 (◆ 학자금 점검·비상금 목표·청년지원 확인·계약 전 점검)

두 Event는 UI에서 시각적으로 구분한다.

### FinKit — Life Event별 금융 Workflow

$$FinKit = Skills + Trigger + Timing$$

사용자는 Skill을 직접 설치하지 않는다. Life Event → Agent가 필요 Skill 자동 선택 → Tool 실행 → 결과 제공.

대표 FinKit: **첫 월급**(실수령액→배분→비상금→학자금→저축→자산형성) · **독립**(필요자금→저축→주거지원→대출→계약→현금흐름) · **졸업**(구직기간→생활비→취업지원→학자금→첫 취업)

### Fin Event 생성 Template (예: 독립, Target 2028.03)

```text
D-12M 독립 비용 추정 · D-9M 목표 저축 계산 · D-6M 주거지원 확인
D-3M 집 탐색 · D-2M 대출 확인 · D-1M 계약 리스크 점검 · D+1M 독립 후 현금흐름 재설계
```

AI가 Template을 사용자 Context에 맞춰 조정한다.

---

## 8. Agent 아키텍처

```text
                 USER
                  ↓
         20s Timeline Context
                  ↓
             20FIN Agent
   ┌──────────────┼──────────────┐
Timeline Engine  Timing Engine  Context Engine
   └──────────────┼──────────────┘
             Fin Event Engine → Skill Orchestrator
              (Search · Calculate · Analyze)
                  ↓
             Decision Engine → UI
```

### Agent 동작 사이클

`Remember`(Life Timeline 기억) → `Anticipate`(금융 Needs 예측) → `Time`(필요 시점 판단) → `Act`(Skill 실행·Action 제안)

### 책임 분리 — 모든 기능을 LLM에 맡기지 않는다

| Layer | 역할 |
| --- | --- |
| **LLM** | 자연어 이해, Life Event 해석, Skill 선택, 결과 요약, 질문 생성 |
| **Rule Engine** | 연령·지역·소득조건·신청기간·Deadline·Trigger |
| **Calculator** | 적금·대출·저축 목표·현금흐름·Readiness |
| **RAG / Search** | 공식 정책·금융기관·주거지원·자산형성 정책 |

### Timing Engine

- **Periodic**: 월급날·매주·매월 말
- **Scheduled**: 졸업 D-90·상환 D-3·독립 D-180
- **Trigger-based**: 새 청년정책·조건 변경·계획 이탈·지출 급증·Life Event 변경

### Skill Type & Backend Tool

- Search: 청년정책·주거지원·금융상품 검색
- Calculate: 적금·대출 상환·목표 저축·주거비
- Analyze: 현금흐름·소비·부채·신용
- Protect: 금융사기·계약 위험·상품 조건 확인

**Tool**: `PolicySearch` · `HousingSearch` · `SavingsCalculator` · `DebtCalculator` · `CashflowCalculator` · `OpportunityMatcher`

**Skill Passport** — 신뢰성을 위해 결과에 Backend Tool 정보(데이터 출처·기준일·입력 데이터·계산 방법·권한·위험도·가능/불가능)를 연결. 기본은 숨기고 **"이 결과는 어떻게 계산했나요?"** 버튼으로 확인.

### Opportunity Ranking

$$Score = Fit \times Timing \times Actionability$$

- **Fit**: 사용자 조건 일치 · **Timing**: 지금 필요한가 · **Actionability**: 실제 행동 가능한가

---

## 9. 데이터 모델

```ts
interface User {
  id: string;
  birthYear: number;
  currentStatus: "student" | "job_seeker" | "employee" | "freelancer" | "other";
  region?: string;
  livingType?: string;
}

interface LifeEvent {
  id: string;
  userId: string;
  type: "education" | "career" | "living" | "finance" | "goal";
  subtype: string;
  title: string;
  date?: string;
  certainty: "confirmed" | "expected" | "goal";
  source: "user";
  status: "past" | "current" | "future";
}

interface FinEvent {
  id: string;
  userId: string;
  lifeEventId?: string;
  title: string;
  type: "check" | "deadline" | "opportunity" | "planning" | "risk";
  dueDate?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "completed" | "dismissed";
  generatedBy: "rule" | "agent";
}

interface FinancialContext {
  userId: string;
  monthlyIncome?: number;
  monthlyExpense?: number;
  savings?: number;
  debts?: { type: string; amount?: number; interestRate?: number }[];
  emergencyFund?: number;
}

interface Opportunity {
  id: string;
  title: string;
  provider: string;
  category: "housing" | "employment" | "asset" | "education" | "finance";
  eligibility: object;
  startDate?: string;
  endDate?: string;
  officialUrl?: string;
  updatedAt: string;
}

interface EventReadiness {
  lifeEventId: string;
  overallScore: number;
  dimensions: { key: string; label: string; score: number }[];
  nextAction?: string;
}
```

---

## 10. API

```http
GET   /api/home
        → { timeline, now, upcoming, opportunity, nextEvents }

GET   /api/timeline
POST  /api/timeline/events
PATCH /api/timeline/events/:id
DELETE /api/timeline/events/:id

POST  /api/fin-events/generate
GET   /api/fin-events
PATCH /api/fin-events/:id

POST  /api/agent/chat
        Request: { message, lifeEventId? }
        Backend가 User Context + Timeline + Financial Context + Relevant Fin Events를 Prompt Context로 자동 포함

GET   /api/opportunities        (query: age, region, status, income, life event, timing)
GET   /api/opportunities/:id
```

---

## 11. 디자인 시스템

전체 분위기: **Young · Calm · Optimistic · Simple** — 금융앱의 무거움보다 20대의 성장과 미래를 표현.

### Color

| 색 | HEX | 역할 |
| --- | --- | --- |
| Primary Green | `#20B26B` | 지금 · 완료 · Primary CTA · Positive Action |
| Yellow | `#FFD95A` | Opportunity · Insight · 캐릭터 Pio |
| Orange | `#FF8B3D` | Deadline · Attention · D-day |
| Cream | `#FFF9E7` | Main Background |
| Dark Navy | `#102A43` | Text |

> 색상 자체가 정보의 의미를 전달한다: Green=지금/완료/행동, Yellow=기회/Insight, Orange=임박/주의, Cream=기본 배경.

### UI Style

Flat Illustration · Rounded Cards · 큰 Border Radius · 매우 옅은 Shadow · 넓은 White Space · 작은 Card 수 · 친근한 Icon · 과도한 Gradient 금지.

### 캐릭터 — 피오(Pio)

20대의 금융 여정을 함께하는 병아리(노란 병아리 + 머리에 초록 새싹 + 작은 주황 부리, Flat/둥근 형태).

- **역할**: Decoration이 아니라 **AI Agent Voice**로 제한.
- **사용**: Onboarding · Empty State · AI Button · Agent Chat · Fin Event 추천 · 성공/완료 메시지
- **미사용**: 모든 Card·Navigation·배경 (교육 서비스처럼 보이지 않도록 절제)

### 레이아웃

- **Desktop**: Sidebar 200px + Timeline(flexible) + Right Panel 320~360px
- **Mobile**: Timeline 가로 Scroll, Event Detail은 Bottom Sheet

### 추천 Stack

Frontend: `Next.js · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · Lucide Icons` (Timeline 시각화는 SVG+CSS+Framer Motion, 복잡한 Chart Library는 MVP 미사용)
Backend: `Next.js Route Handler` 또는 `FastAPI` / DB: `Supabase(PostgreSQL)` / Auth: `Supabase Auth` 또는 `NextAuth`

### Component 구조

```text
App
├─ Sidebar · Header
├─ TimelinePage
│   ├─ TimelineHeader
│   ├─ TimelineCanvas (LifeEventNode · FinEventNode · NowMarker)
│   ├─ UpcomingEvents
│   └─ EventDrawer
├─ RightNowPanel (PriorityAction · UpcomingDeadline · OpportunityPreview)
├─ OpportunityPage
├─ AgentDrawer
└─ Pio
```

---

## 12. MVP 범위 & 우선순위

공모전 MVP에서는 20대 전체 경제생활을 구현하지 않고 **대표 Life Event 3개**에 집중.

1. **졸업 / 취업준비**: 졸업 → 취업지원 → 생활비 → 학자금 → 첫 취업
2. **첫 취업 / 첫 월급**: 취업 → 실수령액 → 비상금 → 부채 → 자산형성
3. **독립**: 독립 → 필요자금 → 주거지원 → 저축 → 대출 → 계약

### 우선순위

| P0 (필수) | P1 | P2 |
| --- | --- | --- |
| Timeline Onboarding | Event Readiness | 소비데이터 연동 |
| Life Event CRUD | D-day | 금융계좌 연결 |
| Timeline UI | Reminder | Push Notification |
| AI Fin Event 생성 | Timeline AI 수정 | 이메일 Brief |
| Right Now 추천 | FinBrief | 전체 Skill Marketplace |
| Opportunity Matching | | |
| Event Detail Drawer | | |
| Agent Chat | | |
| 기본 Calculator | | |
| 공식정보 출처 표시 | | |

---

## 13. Demo 시나리오

**사용자**: 25세 대학 졸업 예정자 — 2023 대학입학 / 2024 학자금대출 / 2027.02 졸업 / 2027.08 취업 목표 / 2028.03 독립 목표

1. **Timeline 생성** — Life Event 입력 시 "5개의 Event를 기반으로 앞으로 필요한 금융 체크포인트를 만들었어요." → Fin Event 자동 생성
2. **Right Now** — "지금, 이것만 챙기세요. 졸업 전 학자금 상태를 먼저 확인해보세요."
3. **Opportunity** — Timeline·조건 기준 청년지원 노출
4. **Agent** — "취업하면 적금부터 들까, 학자금부터 갚을까?" → Timeline+부채+독립 목표 분석
5. **Decision** — "저축 30만원 + 학자금 상환 40만원" + 이유·비교 시나리오

### 서비스 핵심 Loop

```text
Life Event 입력 → Fin Event 생성 → Timeline Update → Timing Monitoring
→ Right Now → Opportunity/Action → AI Decision → Action 완료 → Timeline Update ↺
```

---

## 14. 서비스 원칙 요약

### 사용자에게 전달할 3가지 개념

1. **Timeline** — 내 20대에 앞으로 무슨 일이 있는가
2. **Fin Event** — 그 일을 위해 언제 무엇을 준비해야 하는가
3. **Right Now** — 그래서 오늘 무엇을 하면 되는가

> Skill·FinKit·Timing Engine·RAG·Calculator·Agent Tool은 모두 Backend 시스템으로 숨긴다.

### 20FIN이 하지 않는 것

- 주식 종목을 추천하지 않는다.
- 투자수익률을 임의로 예측하지 않는다.
- 금융상품 가입을 확정적으로 지시하지 않는다.
- 사용자를 대신해 대출심사를 수행하지 않는다.
- 모든 계산을 LLM에 맡기지 않는다.

> **20FIN의 역할**: 사용자의 Life Event에 필요한 금융정보·계산·선택지를 적절한 시점에 제공한다.

### 구현 시 최우선 판단 기준

> 판단이 애매할 때 — **"이 기능이 사용자의 Timeline을 더 잘 이해하거나, 지금 해야 할 행동을 더 명확하게 만들어주는가?"** 아니라면 MVP에서 제거한다.

20FIN의 핵심은 **기능이 많은 금융 대시보드가 아니라, 사용자의 20대를 하나의 시간축으로 이해하는 금융 Agent**다.
