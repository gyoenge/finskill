# FinSkill
> 필요한 금융 능력을 연결하다.

**AI 금융 Skill Marketplace & Personal Agent Platform**

---

## 1. 서비스 개요

### 1.1 서비스명

**FinSkill**

Finance + Skill의 합성어로,
사용자가 자신에게 필요한 금융 AI 능력(Skill)을 발견하고,
자신만의 AI Agent에 장착하여 사용할 수 있는 플랫폼을 의미한다.

---

### 1.2 한 줄 소개

> **필요한 금융 AI Skill을 골라 장착하고,
> 나만의 금융 Agent를 만드는 Skill Platform**

---

### 1.3 핵심 콘셉트

기존 금융 AI 서비스는 서비스 제공자가 미리 정의한 기능을
사용자가 수동적으로 사용하는 구조이다.

FinSkill은 이를 뒤집는다.

사용자는 Skill Shop에서 필요한 금융 Skill을 직접 선택하거나,
자신의 Persona에 맞는 Skill Set을 추천받아
자신만의 금융 Agent를 구성할 수 있다.

Agent는 장착된 Skill을 상황에 따라 호출하고 조합하여
사용자의 금융 문제를 해결한다.

핵심 구조:

사용자
↓
Skill 발견
↓
Agent에 장착
↓
Skill 조합
↓
금융 문제 해결

---

# 2. 문제 정의

## 2.1 금융정보는 많지만 개인에게 필요한 정보는 찾기 어렵다

청년 금융소비자는 다음과 같은 다양한 금융 문제를 동시에 경험한다.

- 자산형성
- 소비 관리
- 예·적금
- 학자금대출
- 신용관리
- 주거비
- 청년정책
- 장학금
- 투자 기초
- 금융사기

각 정보는 금융회사, 공공기관, 지자체, 금융 플랫폼 등에
분산되어 있다.

따라서 사용자는 자신의 문제마다
적절한 서비스를 직접 탐색해야 한다.

---

## 2.2 범용 생성형 AI에도 한계가 존재한다

ChatGPT, Claude와 같은 범용 AI는
금융정보를 쉽게 설명할 수 있다는 장점이 있다.

하지만 금융서비스 관점에서는 다음 문제가 존재한다.

### 최신성

금융상품, 정책, 공고는 지속적으로 변경된다.

### 출처

AI가 어떤 금융정보를 근거로 답변했는지
사용자가 판단하기 어렵다.

### 전문 기능

실시간 공고 검색, 금융계산, 자격조건 매칭 등의 작업은
일반적인 LLM 대화만으로 처리하기 어렵다.

### 신뢰

금융은 사용자의 실제 의사결정에 영향을 미치므로
AI가 무엇을 할 수 있고 무엇을 할 수 없는지
명확하게 관리할 필요가 있다.

---

## 2.3 AI Agent의 능력은 플랫폼에 종속되어 있다

현재 AI 서비스의 기능은 대부분
특정 서비스 또는 Agent 내부에 묶여 있다.

사용자가 원하는 것은 AI 자체보다
AI가 수행할 수 있는 **능력(Capability)**일 수 있다.

FinSkill은 이러한 능력을 독립적인 **Skill** 단위로 분리한다.

---

# 3. 해결방안

## 3.1 FinSkill의 제안

> **금융 AI를 하나의 블랙박스로 제공하지 않고,
> 검증 가능한 Skill 단위로 분해하여
> 사용자가 직접 발견·장착·조합할 수 있도록 한다.**

각 금융 기능을 독립적인 Skill로 정의한다.

예:

- 청년정책 검색
- SH 청년주택 검색
- LH 임대주택 검색
- 장학금 탐색
- 예·적금 비교
- 소비 분석
- 적금 계산
- 금융용어 설명
- 금융사기 탐지
- 목표저축 플래너

사용자는 필요한 Skill을 Agent에 장착한다.

---

# 4. 핵심 서비스 구조

FinSkill의 기본 구조는 다음과 같다.

Skill
= 하나의 금융 능력

FinTool
= Skill이 사용하는 실행 도구/API

FinKit
= Persona 또는 목적별 추천 Skill 묶음

Skill Recipe
= 여러 Skill의 실행 순서 및 협업 방식

Agent
= Persona + Instructions + Skills + Model

---

# 5. 핵심 사용자

## 5.1 Primary Target

**20대 청년 금융소비자**

특히:

- 대학생
- 취업준비생
- 사회초년생
- 자취생
- 금융 초보자

를 초기 핵심 사용자로 설정한다.

---

## 5.2 사용자 특징

- 금융 전문지식이 부족하다.
- 여러 금융서비스를 비교하기 어렵다.
- 금융·주거·교육·정책 문제가 서로 연결되어 있다.
- 생성형 AI 사용에는 익숙하다.
- 자신의 상황에 맞는 정보를 빠르게 얻고 싶어 한다.

---

# 6. Skill Taxonomy

FinSkill은 Skill을 금융 분야와 기능 유형으로
이중 분류한다.

## 6.1 금융 분야 Category

- 자산형성
- 저축
- 투자
- 대출/신용
- 소비
- 주거
- 교육/장학
- 청년정책
- 금융보안
- 금융상식

---

## 6.2 기능 Type

### FIND

금융기회를 탐색한다.

- Search
- Match
- Compare

### UNDERSTAND

복잡한 금융정보를 이해한다.

- Explain
- Calculate

### MANAGE

사용자의 금융생활을 분석하고 관리한다.

- Analyze
- Plan

### PROTECT

사용자의 금융생활을 보호한다.

- Protect
- Action

---

## 6.3 세부 유형

| Type | 기능 | 예시 |
|---|---|---|
| Search | 정보 탐색 | SH 공고 검색 |
| Match | 사용자 조건 매칭 | 장학금 매칭 |
| Compare | 선택지 비교 | 예·적금 비교 |
| Explain | 정보 설명 | 금융용어 설명 |
| Calculate | 금융 계산 | 적금 계산 |
| Analyze | 데이터 분석 | 소비 분석 |
| Plan | 행동계획 | 목표저축 플래너 |
| Protect | 위험 탐지 | 금융사기 탐지 |
| Action | 외부 행동 | 알림/일정 등록 |

---

# 7. 핵심 기능

## 7.1 Skill Shop

금융 AI Skill을 발견하고 설치할 수 있는 Marketplace.

사용자는 다음 기준으로 Skill을 탐색한다.

- 분야
- 기능
- Persona
- 인기
- 신규
- 검증 여부
- 데이터 출처
- 위험도

### Skill Card

각 Skill Card에는 다음 정보를 표시한다.

- Skill 이름
- 아이콘
- 한 줄 설명
- Category
- Type
- 제공자
- 데이터 출처
- 평점
- 사용자 수
- Verified 여부
- 위험도
- 설치 버튼

---

# 8. FinKit

## 8.1 개념

FinKit은 특정 Persona 또는 금융 목적에 맞게
여러 Skill을 미리 구성한 Skill Set이다.

사용자는 Skill을 하나씩 찾을 필요 없이
FinKit 하나를 설치할 수 있다.

---

## 8.2 예시

### 대학생 FinKit

- 장학금 탐색
- 학자금대출 설명
- 청년정책 검색
- SH/LH 청년주택 검색
- 소비 분석
- 금융용어 설명

### 사회초년생 FinKit

- 급여관리
- 비상금 플래너
- 예·적금 비교
- ISA 설명
- 신용관리
- 전월세 지원 탐색

### 자취생 FinKit

- SH 검색
- LH 검색
- 주거비 분석
- 청년 주거정책
- 소비 분석

### 금융초보 FinKit

- 금융용어 설명
- 금융상품 설명
- 적금 계산
- 금융사기 대응

---

# 9. Persona 기반 Skill 추천

사용자는 온보딩 과정에서 간단한 정보를 입력한다.

예:

- 연령대
- 직업/상태
- 거주지역
- 주거형태
- 주요 금융관심사
- 금융지식 수준

예:

23세
대학생
서울
자취
관심: 자산형성 / 장학금 / 주거

FinSkill은 이를 기반으로 적절한 Skill 또는 FinKit을 추천한다.

> "서울에서 자취하는 대학생에게 많이 필요한 Skill입니다."

초기 MVP에서는 규칙 기반 추천을 사용하고,
향후 사용자 행동 데이터를 기반으로
추천 모델로 확장한다.

---

# 10. My Skills

사용자가 설치한 모든 Skill을 관리하는 공간.

가능한 기능:

- 활성화 / 비활성화
- Agent에 장착
- 버전 확인
- 업데이트
- 권한 확인
- 삭제
- Skill Passport 확인

---

# 11. Agent Builder

## 11.1 Agent 정의

Agent는 다음 요소로 구성된다.

Agent
=
Persona
+
Instructions
+
Skill Set
+
LLM

---

## 11.2 생성 과정

STEP 1
Agent 이름 설정

STEP 2
Persona 설정

STEP 3
Skill 선택

STEP 4
Agent 역할 설정

STEP 5
생성

---

## 11.3 예시

Agent Name:
나의 대학생활 금융비서

Persona:
대학생 금융생활 도우미

Skills:

- 장학금 찾기
- SH 청년주택 검색
- 소비 분석
- 금융용어 설명
- 청년정책 검색

---

# 12. Agent Chat

사용자는 완성된 Agent와 자연어로 대화한다.

예:

사용자:
"서울에서 자취하는 대학생인데
이번 학기 돈을 좀 아끼고 싶어."

Agent는 사용 가능한 Skill을 분석한다.

소비 분석
↓
청년주거 검색
↓
청년정책 검색
↓
Action Planner

결과:

"현재 주거비가 가장 큰 고정비입니다.
동시에 검토할 수 있는 청년주거 관련 공고와
지원정책을 찾아보겠습니다."

---

# 13. Skill Routing

Agent는 사용자의 요청에 따라
필요한 Skill을 선택한다.

사용자 질문
↓
Intent 분석
↓
사용 가능한 Skill 확인
↓
Skill 선택
↓
Skill 실행
↓
결과 수집
↓
LLM 설명
↓
최종 답변

LLM이 모든 작업을 직접 수행하지 않는다.

검색은 Search Skill,
계산은 Calculator Skill,
공공데이터 조회는 API Skill이 담당한다.

---

# 14. FinSkill 고유 기능 ①
# Skill Gap

## 개념

사용자가 요청한 작업을 수행하는 데 필요한 Skill이
현재 Agent에 없을 경우,
Agent가 부족한 능력을 발견한다.

예:

사용자:
"장학금 찾아주고 남은 등록금 계획도 세워줘."

현재 Agent:

✓ 장학금 검색

부족한 Skill:

+ 등록금 계산
+ 자금계획

UI:

"이 요청을 완전히 해결하려면
2개의 Skill이 더 필요합니다."

[추천 Skill 장착하고 계속하기]

---

## 가치

기존 AI:
기능이 없으면 수행하지 못함

FinSkill:
부족한 능력을 스스로 발견하고 확장

핵심 메시지:

> **질문할수록 내 Agent가 필요한 금융 능력을 갖춘다.**

---

# 15. FinSkill 고유 기능 ②
# Skill Recipe

## 개념

하나의 복잡한 금융문제를 해결하기 위해
여러 Skill의 실행 순서를 하나의 Recipe로 저장한다.

예:

### 독립준비 Recipe

내 금융상태 분석
↓
청년주거 검색
↓
지원자격 Match
↓
예상 주거비 Calculate
↓
금융상품 Compare
↓
저축계획 Plan

Recipe 자체를 저장하고 공유할 수 있다.

---

## 구조

Skill
= 하나의 능력

FinKit
= 능력의 묶음

Recipe
= 능력들이 협업하는 방법

---

# 16. FinSkill 고유 기능 ③
# Skill Passport

금융 AI Skill의 신뢰성과 위험을
한눈에 확인할 수 있는 정보표.

예:

청년주택 Finder

Verified ✓

DATA SOURCE
SH
LH
공공데이터포털

CAN DO
검색
비교
자격조건 확인

CANNOT DO
신청
계약
결제

PERMISSION
개인정보: 없음
외부통신: SH/LH
금융실행: 없음

RISK
LOW

LAST UPDATED
2026.08.30

---

## 목적

금융 AI의 핵심 문제인

- 출처
- 권한
- 개인정보
- 실행범위
- 위험

를 사용자에게 투명하게 공개한다.

---

# 17. FinSkill 고유 기능 ④
# Skill DNA

Agent의 금융 능력을 시각화한다.

4개의 핵심 축:

FIND
UNDERSTAND
MANAGE
PROTECT

예:

FIND        82
UNDERSTAND  65
MANAGE      74
PROTECT     42

AI 분석:

"현재 Agent는 금융기회를 찾는 능력은 강하지만
금융보호 능력이 부족합니다."

추천:

+ 금융사기 대응 Skill

---

# 18. FinSkill 고유 기능 ⑤
# Skill Fusion

두 개 이상의 Skill을 조합해
새로운 Custom Skill을 만드는 기능.

예:

SH 공고 검색
+
개인 조건 매칭

↓

"나에게 맞는 SH 청년주택 찾기"

사용자는 코드를 작성하지 않고
퍼즐을 결합하는 방식으로 Skill을 만들 수 있다.

---

# 19. FinSkill 고유 기능 ⑥
# Skill Trace

Agent가 어떤 Skill과 데이터를 사용했는지
사용자가 확인할 수 있다.

답변 하단:

[어떻게 찾았나요?]

클릭:

Scholarship Search
12개 결과
↓
Eligibility Match
3개 후보
↓
Tuition Calculator
부담액 계산
↓
Action Planner
신청순서 생성

Used:
4 Skills

Source:
한국장학재단 / 공공데이터

중요:
내부 Chain-of-Thought를 노출하는 것이 아니라
실행된 Skill, Tool, 데이터 출처만 표시한다.

---

# 20. Skill 실행 방식

Skill은 실행방식에 따라 크게 세 종류로 구분한다.

## API Skill

외부 API를 호출한다.

예:

- LH 공고 검색
- 공공데이터 검색
- 금융상품 검색

Agent
→ Skill
→ API
→ JSON
→ Agent

---

## RAG Skill

공식 문서를 검색하여
LLM이 근거 기반으로 답한다.

예:

- 금융용어 설명
- 금융정책 설명
- 금융상품 약관 해석

Agent
→ Vector Search
→ Official Documents
→ LLM

---

## Calculator Skill

금융 계산을 deterministic code로 수행한다.

예:

- 적금 계산
- 대출이자 계산
- 저축률 계산
- DSR 계산

Agent
→ Calculator
→ Result

금융 계산을 LLM 자체에 맡기지 않는다.

---

# 21. Custom Skill Builder

사용자가 직접 Skill을 제작할 수 있다.

초기 MVP에서는 No-code 방식으로 구현한다.

입력:

Skill 이름
설명
Input
Output
사용할 데이터
Instruction

예:

Skill Name:
월 예산 분석

Input:
월수입
월세
식비
교통비
기타지출

Output:
저축률
가장 큰 지출
개선 가능 금액

플랫폼이 이를 Skill Manifest로 자동 변환한다.

---

# 22. Skill Manifest

각 Skill은 공통 표준 포맷을 가진다.

예:

id: sh-youth-housing
name: SH 청년주택 검색
version: 1.0.0

category:
  - housing
  - youth

type:
  - search
  - match

permissions:
  network:
    - sh.go.kr

  personal_data: false
  write_action: false

risk:
  level: low

executor:
  type: http

source:
  organization: SH

---

# 23. Skill Trust Layer

금융 특화 Skill Platform이므로
Skill 안전성 검증을 핵심 기능으로 둔다.

검증 항목:

- 데이터 출처
- 개인정보 접근
- 외부 네트워크
- 금융행위
- 데이터 수정
- 거래 가능 여부
- 업데이트 일자

위험도:

LOW
MEDIUM
HIGH

예:

공식 공공데이터 조회
→ LOW

개인 금융정보 분석
→ MEDIUM

실제 금융거래 수행
→ HIGH

MVP에서는 실제 송금, 투자주문, 대출신청 등
고위험 Action Skill은 제공하지 않는다.

---

# 24. 외부 AI 확장

FinSkill의 장기적 핵심 방향은
Skill을 특정 Agent에 종속시키지 않는 것이다.

내부 구조:

FinSkill Standard
↓
Adapter Layer
↓
External AI Environment

지원 목표:

- Claude-compatible Skill
- MCP
- ChatGPT-compatible Connector/Tool
- Agent JSON

---

## 핵심 원칙

"하나의 파일이 모든 AI에서 그대로 작동한다"고 가정하지 않는다.

플랫폼별 Adapter를 통해
각 환경에 맞는 형식으로 변환한다.

---

# 25. Export

Agent 또는 Skill 페이지에서:

Export

- Claude Skill
- MCP
- Agent JSON

등을 제공한다.

장기적으로 사용자가 자신의 AI 능력을
특정 플랫폼에 종속시키지 않고
다른 AI 환경에서도 활용하도록 한다.

---

# 26. 데이터 구조

## skills

id
name
description
category
type
developer_id
version
icon_url
install_count
rating
risk_level
verified
created_at
updated_at

---

## user_skills

user_id
skill_id
version
enabled
installed_at

---

## agents

id
user_id
name
persona
system_prompt
model
created_at

---

## agent_skills

agent_id
skill_id
enabled
priority

---

## persona_packs

id
name
persona
description

---

## pack_skills

pack_id
skill_id

---

## skill_permissions

skill_id
network_access
personal_data_access
write_action
financial_transaction

---

## recipes

id
name
description
creator_id
visibility

---

## recipe_steps

recipe_id
step_order
skill_id
input_mapping
output_mapping

---

# 27. 주요 화면

## 01. Home

목적:
서비스 진입 및 개인화 추천

구성:

- 사용자 Greeting
- My Agent
- 추천 FinKit
- 추천 Skill
- 최근 사용 Skill
- Skill Gap 알림

---

## 02. Skill Shop

구성:

- 검색
- Category
- Type
- Persona
- Verified Filter
- Skill Card
- 인기 Skill
- 신규 Skill

---

## 03. Skill Detail

구성:

- Skill 설명
- 기능
- 데이터 출처
- 사용 예시
- Passport
- Permission
- Rating
- 설치

---

## 04. My Skills

구성:

- 설치된 Skill
- On / Off
- Agent 장착
- 업데이트
- 삭제
- Passport

---

## 05. FinKit

구성:

- Persona별 추천
- 포함 Skill
- 추천 이유
- 한 번에 설치

---

## 06. Agent Builder

구성:

- Agent 이름
- Persona
- Instructions
- Skill 선택
- FinKit 선택
- Agent Preview
- 생성

---

## 07. Agent Chat

구성:

- Conversation
- 현재 장착 Skill
- 실행 중 Skill 표시
- Skill Gap
- Skill Trace
- Source
- Agent Settings

---

## 08. Skill Builder

구성:

- Skill Name
- Description
- Input
- Output
- Data Source
- Permission
- Test
- Publish

---

## 09. Skill Passport

구성:

- Verified
- Data Source
- Permission
- Risk
- Capability
- Limitation
- Last Update

---

# 28. 핵심 User Flow

## Flow A: 처음 사용하는 사용자

회원가입
↓
Persona 설정
↓
추천 FinKit
↓
Skill 확인
↓
Agent 자동 생성
↓
Chat 시작

---

## Flow B: Skill Shop 중심

Skill Shop
↓
Skill 검색
↓
Passport 확인
↓
설치
↓
My Skills
↓
Agent에 장착
↓
사용

---

## Flow C: Skill Gap

Agent Chat
↓
사용자 요청
↓
Skill 부족 감지
↓
추천 Skill
↓
사용자 승인
↓
장착
↓
기존 요청 계속 실행

---

## Flow D: Custom Agent

Agent Builder
↓
Persona
↓
Skill 선택
↓
Recipe 선택
↓
Agent 생성
↓
Chat
↓
Export

---

# 29. UI / UX Design System

## 디자인 방향

- Simple
- Friendly
- Trustworthy
- Modular
- Financial + AI

현재 FinSkill BI의
퍼즐 구조를 핵심 인터랙션 메타포로 사용한다.

---

## 핵심 UI Metaphor

Skill
= Puzzle Piece

Agent
= Skill이 결합되는 Base

Skill 장착
= Snap

Skill 제거
= Detach

Skill 조합
= Fusion

FinKit
= Puzzle Set

---

## Color

Primary:
FinSkill Green / Teal

Secondary:
FinSkill Blue

Background:
White / very light gray

Text:
Deep navy

Risk:
별도의 상태색 사용

---

## 디자인 원칙

### 1. One Screen, One Goal

각 화면의 주요 행동을 하나로 제한한다.

### 2. Progressive Disclosure

처음부터 모든 금융정보를 노출하지 않는다.

### 3. Visible Trust

출처와 권한을 숨기지 않는다.

### 4. Human-readable Finance

금융전문용어보다 사용자 행동 중심으로 표현한다.

### 5. Skill-first Interaction

기능을 메뉴가 아니라
"장착 가능한 능력"으로 표현한다.

---

# 30. MVP 범위

공모전 MVP에서 모든 기능을 구현하지 않는다.

## 반드시 구현

### 1. Skill Shop

6~8개 실제 Skill 제공

### 2. Persona Recommendation

4개 Persona

- 대학생
- 사회초년생
- 자취생
- 금융초보

### 3. FinKit

Persona별 Skill Set 제공

### 4. Agent Builder

Skill 장착/해제

### 5. Agent Chat

LLM + Skill Routing

### 6. Skill Trace

실행 Skill 및 출처 표시

### 7. Skill Passport

데이터/권한/위험도 표시

### 8. Skill Gap

부족 Skill 탐지 및 설치

---

# 31. MVP Skill 후보

1. SH 청년주택 검색
2. LH 청년주택 검색
3. 장학금 탐색
4. 청년정책 검색
5. 금융용어 설명
6. 적금 계산
7. 소비 분석
8. 금융사기 대응

---

# 32. MVP 기술 구조

Frontend:
Next.js

UI:
Tailwind CSS
shadcn/ui

Backend:
FastAPI 또는 Next.js API

Database:
Supabase PostgreSQL

Authentication:
Supabase Auth

LLM:
LLM API

RAG:
pgvector

Skill Execution:
Python / HTTP API

Hosting:
Vercel + Backend Hosting

---

# 33. Agent Runtime

User
↓
Agent
↓
Intent / Tool Selection
↓
Skill Router
↓
Skill Executor
↓
API / RAG / Calculator
↓
Structured Result
↓
LLM
↓
User Response

---

# 34. 금융 AI 안전 설계

FinSkill은 AI의 역할과 deterministic system의 역할을 분리한다.

## AI 담당

- 질문 이해
- Skill 선택
- 결과 요약
- 쉬운 설명
- 사용자 맥락 반영

## Code 담당

- 금융 계산
- 조건 필터링
- API 호출
- 권한 확인
- 위험도 판단

## Official Data 담당

- 상품 조건
- 정책정보
- 공고
- 금융 정의

---

# 35. FinSkill의 차별점

## 기존 금융 AI

하나의 AI가 모든 금융문제를 해결하려 한다.

## FinSkill

금융 AI를 검증 가능한 작은 Skill로 분해한다.

사용자는:

Discover
↓
Snap
↓
Solve

한다.

---

# 36. 핵심 Brand Experience

## DISCOVER

나에게 필요한 금융 능력을 발견한다.

## SNAP

퍼즐처럼 Agent에 Skill을 장착한다.

## SOLVE

여러 Skill이 협업하여
실제 금융문제를 해결한다.

---

# 37. 핵심 가치 제안

### Personal

모든 사용자에게 동일한 금융 AI가 아니라
나에게 필요한 Skill만 장착한다.

### Modular

Skill을 자유롭게 추가하고 제거한다.

### Explainable

어떤 Skill과 데이터가 답을 만들었는지 확인한다.

### Trusted

금융 Skill의 출처, 권한, 위험도를 공개한다.

### Portable

장기적으로 특정 AI 플랫폼에 종속되지 않는다.

### Extensible

새로운 금융 Skill을 지속적으로 추가할 수 있다.

---

# 38. 공모전 핵심 메시지

> 생성형 AI 시대의 금융서비스에서 중요한 것은
> 더 거대한 하나의 AI를 만드는 것이 아니라,
> 사용자가 자신에게 필요한 금융 AI 능력을
> 안전하게 선택하고 조합할 수 있도록 하는 것이다.

FinSkill은 금융 AI의 능력을
검증 가능한 Skill 단위로 분리한다.

사용자는 Skill Shop에서 필요한 금융 능력을 발견하고,
자신의 Agent에 퍼즐처럼 장착한다.

Agent는 여러 Skill을 조합해
사용자의 실제 금융문제를 해결한다.

그리고 각 Skill의 데이터 출처,
접근 권한, 위험 수준과 실행 과정을
사용자가 확인할 수 있도록 한다.

---

# 39. 서비스 핵심 문장

> **FinSkill — 필요한 금융 능력을 연결하다.**

또는

> **Build your financial AI, skill by skill.**

---

# 40. 향후 확장

Phase 1
청년 금융 Skill Platform

Phase 2
전체 금융소비자로 Persona 확대

Phase 3
금융기관 / FinTech Skill 공급자 참여

Phase 4
Skill Creator Marketplace

Phase 5
Cross-platform Skill Standard 및 MCP 확장

궁극적으로 FinSkill은
특정 금융 AI 서비스를 만드는 것이 아니라,

> **금융 AI가 사용할 수 있는 능력을
> 발견하고, 검증하고, 조합하고, 이동시키는
> 금융 AI Skill Infrastructure**

로 확장한다.
