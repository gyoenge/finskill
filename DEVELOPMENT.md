# FinSkill — 구현 문서

이 문서는 [README.md](README.md) 의 기획을 실제로 어떻게 구현했는지 정리한 개발자 문서입니다.
README.md 는 기획 원본이므로 수정하지 않았습니다.

---

## 1. 실행 방법

```bash
npm install
npm run dev
```

http://localhost:3000 접속 → 온보딩(Persona 설정)부터 시작합니다.

### LLM 연결 (선택)

```bash
cp .env.example .env.local
# .env.local 에 ANTHROPIC_API_KEY 입력
```

키가 **없어도** Skill 라우팅 · 실행 · Trace · Skill Gap 은 전부 동작합니다.
키가 없으면 규칙 기반 Fallback Router 가 Skill 을 고르고, Skill 실행 결과가 요약 없이 그대로 표시됩니다.
키가 있으면 Claude 가 (1) Skill 선택 과 (2) 결과 설명 두 지점을 담당합니다.

**identity-linked API key** 를 쓰는 경우 `ANTHROPIC_WORKSPACE_ID` 도 함께 넣어야 합니다.
없으면 `400 anthropic-workspace-id is required ...` 로 호출이 실패하고 Fallback 으로 넘어갑니다.

> 참고: Anthropic SDK 는 `ANTHROPIC_BASE_URL` 환경변수를 자동으로 사용합니다.
> 셸에 이 값이 이미 설정되어 있다면 의도한 엔드포인트인지 확인하세요.

### 모델 파라미터 주의사항

현행 모델(Opus 5 / Sonnet 5 등)은 이전 세대와 요청 계약이 다릅니다. `src/lib/llm.ts` 참고:

- `temperature` / `top_p` / `top_k` 는 **제거**되었습니다. 보내면 `400 \`temperature\` is deprecated for this model.` 출력 편차는 `output_config.effort` 로 조절합니다.
- thinking 이 기본 활성화이고 **thinking 토큰도 `max_tokens` 를 소비**합니다. 예산을 작게 잡으면 본문이 잘리므로 라우터 4000 / 답변 8000 으로 설정했습니다.
- effort 는 라우터 `low`(단순 분류), 답변 `medium` 입니다.

### 데모 초기화

홈 우측 상단 **데모 초기화** 버튼 또는:

```bash
curl -X DELETE http://localhost:3000/api/state
```

---

## 2. 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| Frontend | Next.js 16 (App Router) + React 19 | |
| UI | Tailwind CSS v4 | 디자인 시스템은 `src/app/globals.css` 의 `@theme` 토큰 |
| Backend | Next.js Route Handlers | README §32 의 "FastAPI 또는 Next.js API" 중 후자 |
| Data (사용자 상태) | 파일 기반 JSON 스토어 | Supabase 로 교체 가능하도록 `src/lib/store.ts` 한 곳에 격리 |
| Data (금융 데이터) | 목업 시드 (`src/lib/data/seed`) | 실제 기관 공고 필드 구조를 따름 |
| LLM | Anthropic Claude (`claude-opus-5`) | 키 없으면 자동 Fallback. `FINSKILL_MODEL` 로 변경 가능 |

**사용자 상태 저장 위치**: `node_modules/.cache/finskill/store.json`
(`next dev` 의 파일 워처가 프로젝트 루트를 감시하기 때문에, 그 안에 두면 상태를 저장할 때마다
Fast Refresh 가 돌아 채팅 입력 등 클라이언트 상태가 초기화됩니다. `FINSKILL_STORE_PATH` 로 변경 가능.)

---

## 3. 디렉터리 구조

```
src/
├── app/
│   ├── page.tsx                    01 Home
│   ├── onboarding/                 Persona 설정 (Flow A)
│   ├── shop/                       02 Skill Shop
│   ├── shop/[id]/                  03 Skill Detail + 09 Skill Passport
│   ├── my-skills/                  04 My Skills
│   ├── finkits/                    05 FinKit + Skill Recipe
│   ├── agents/new/                 06 Agent Builder
│   ├── agents/[id]/chat/           07 Agent Chat
│   ├── skill-builder/              08 Skill Builder
│   └── api/                        Route Handlers
├── components/                     UI · 도메인 컴포넌트
└── lib/
    ├── types.ts                    Skill Manifest 등 도메인 타입 (§22, §26)
    ├── store.ts                    사용자 상태 저장소
    ├── llm.ts                      Claude 호출 + Fallback 판단
    ├── recommend.ts                Persona 매칭 · Skill DNA (§9, §17)
    ├── agent/
    │   ├── router.ts               Intent 분석 → Skill 선택 → Skill Gap (§13, §14)
    │   ├── executor.ts             API / RAG / Calculator 실행 (§20)
    │   └── runtime.ts              Agent Runtime 파이프라인 (§33)
    └── data/
        ├── skills.ts               Skill 카탈로그 12개
        ├── personas.ts             Persona 4 · FinKit 4 · Recipe 3 · Taxonomy
        └── seed/                   목업 공고 · 장학금 · 정책 · 상품 · 문서 · 사기패턴
```

---

## 4. MVP 필수 8기능 구현 위치 (README §30)

| # | 기능 | 구현 |
|---|---|---|
| 1 | Skill Shop | `src/app/shop/` + `src/components/ShopClient.tsx` — 검색 / 분야 / 기능(4축) / Persona / Verified / 정렬 |
| 2 | Persona Recommendation | `src/lib/recommend.ts` `matchPersona()` — 상태·주거·지식·관심사 규칙 기반 스코어링 |
| 3 | FinKit | `src/app/finkits/` — Persona별 4종, 부족한 Skill만 골라 일괄 설치 |
| 4 | Agent Builder | `src/components/AgentBuilder.tsx` — STEP 1~5 + Preview + Skill DNA + 권한 미리보기 |
| 5 | Agent Chat | `src/app/agents/[id]/chat/` + `src/lib/agent/runtime.ts` — SSE 스트리밍 |
| 6 | Skill Trace | `src/components/Trace.tsx` — "어떻게 찾았나요?" / 실행 Skill · Executor 종류 · 소요시간 · 출처 |
| 7 | Skill Passport | `src/components/Passport.tsx` — DATA SOURCE / CAN DO / CANNOT DO / PERMISSION / RISK / LAST UPDATED |
| 8 | Skill Gap | `src/lib/agent/router.ts` + `src/components/SkillGapPanel.tsx` — 탐지 → 추천 → 승인 → 장착 → **원래 요청 자동 재실행** |

추가 구현: **Skill DNA**(§17), **Skill Recipe**(§15), **Custom Skill Builder**(§21) 및 Manifest 자동 변환(§22).

---

## 5. Agent Runtime (§33)

```
사용자 질문
  ↓  routeSkills()          ← LLM 또는 규칙 기반
Intent 분석 · Skill 선택 · Skill Gap 탐지
  ↓  runSkill()             ← deterministic code
API Skill / RAG Skill / Calculator Skill
  ↓
Structured Result (+ facts 텍스트)
  ↓  complete()             ← LLM (선택)
최종 답변 + Skill Trace + Skill Gap
```

### 금융 AI 안전 설계 (§34)

- **AI 담당**: 질문 이해, Skill 선택, 결과 요약
- **Code 담당**: 금융 계산, 조건 필터링, 자격 판정, 권한 확인
- **Official Data 담당**: 상품 조건, 정책정보, 공고, 금융 정의

답변 생성 프롬프트(`ANSWER_SYSTEM`)는 *"Skill 실행 결과에 없는 공고명·금액·금리·마감일을 지어내지 않는다"*,
*"숫자는 Skill 이 계산한 값을 그대로 인용한다"* 를 강제합니다.
금융 계산은 전부 `executor.ts` 의 순수 함수가 수행합니다. (적금 단리 이자, 이자소득세 15.4%, 저축률, DSR 성격의 비율 등)

**MVP 는 고위험 Action Skill 을 제공하지 않습니다.** 모든 Skill 의
`permissions.financialTransaction` 은 `false` 이며, Custom Skill 도 이 값을 켤 수 없습니다. (§23)

---

## 6. Skill 카탈로그 (12개)

README §31 의 MVP 후보 8개 + FinKit / Skill Gap 구성을 위한 4개.

| Skill | Category | Type | Executor | Risk |
|---|---|---|---|---|
| SH 청년주택 검색 | 주거·청년 | Search, Match | API | LOW |
| LH 청년주택 검색 | 주거·청년 | Search, Match | API | LOW |
| 장학금 탐색 | 교육/장학 | Search, Match | API | LOW |
| 청년정책 검색 | 청년정책 | Search, Match | API | LOW |
| 금융용어 설명 | 금융상식 | Explain | RAG | LOW |
| 적금 계산 | 저축 | Calculate | Calculator | LOW |
| 소비 분석 | 소비 | Analyze | Calculator | **MEDIUM** (개인 금융정보) |
| 금융사기 대응 | 금융보안 | Protect | RAG | LOW |
| 예·적금 비교 | 저축·자산형성 | Compare, Search | API | LOW |
| 목표저축 플래너 | 자산형성·저축 | Plan | Calculator | LOW |
| 등록금·학자금 플래너 | 교육·대출/신용 | Calculate, Explain | Calculator | LOW |
| 신용관리 코치 | 대출/신용 | Explain, Plan | RAG | **MEDIUM** (부채·연체 정보) |

---

## 7. API

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/state` | 사용자 상태 + Skill 카탈로그 |
| DELETE | `/api/state` | 데모 초기화 |
| POST | `/api/onboarding` | Persona 매칭 + 추천 FinKit |
| POST | `/api/skills` | `install` / `uninstall` / `toggle` (install 은 `agentId` 로 즉시 장착 가능 — Skill Gap 흐름) |
| POST | `/api/skills/custom` | Custom Skill 게시 (Manifest 자동 변환) |
| POST | `/api/agents` | Agent 생성 |
| PATCH · DELETE | `/api/agents/[id]` | Agent 수정 / 삭제 |
| POST | `/api/chat` | Agent Runtime 진입점 |

---

## 8. 검증한 시나리오

- **Flow A** 온보딩 → 대학생 Persona 매칭 → 대학생 FinKit(7개) 설치 → Agent 자동 생성 → Chat 진입
- **Flow B** Skill Shop → 필터 → Skill Detail/Passport → 설치 → My Skills → Agent 장착
- **Flow C** "장학금 찾아주고 남은 등록금 자금계획도 세워줘" → 목표저축 플래너 부족 감지 →
  장착 승인 → **원래 질문 자동 재실행** (Skill 2개 → 3개)
- **Flow D** Agent Builder에서 FinKit·Recipe로 Skill 일괄 선택 → 생성 → Chat
- Calculator 정확성: 월 30만원 × 12개월 연 3.5% → 원금 3,600,000 / 세전이자 68,250 / 세금 10,510 / 수령액 3,657,740
- 소비 분석: 수입 180만 / 월세 55만 · 식비 45만 · 교통 8만 · 기타 12만 → 저축률 33.3%, 주거비 비중 30.6%, 절감 가능 10만원
- 금융사기: "저금리 대환대출 + 앱 설치 + 인증번호" → 위험 신호 3건 · 위험도 **높음**
- LLM 키가 잘못된 경우: 라우팅·실행은 정상 동작하고 요약만 Fallback (HTTP 200, 크래시 없음)

### 스트리밍 (SSE)

Agent Chat 은 `/api/chat` 에서 Server-Sent Events 로 진행 상황을 흘려보냅니다.

```
user → trace → gap? → delta* → done
```

- `trace` 를 먼저 보내 답변 생성을 기다리는 동안 Skill 실행 결과가 화면에 먼저 뜹니다.
- LLM 이 스트리밍 도중 끊기면 `reset` 으로 부분 텍스트를 버린 뒤 Fallback 답변을 보냅니다.
  (잘린 문장 뒤에 Fallback 이 덧붙어 뒤섞이는 것을 막습니다.)
- 키가 없거나 호출이 실패하면 `delta` 한 번으로 Fallback 답변 전체를 보냅니다.

측정 결과 (동일 질문 기준):

| 지표 | 스트리밍 전 | 스트리밍 후 |
|---|---|---|
| Skill Trace 표시 | 11.5초 | **2.7초** |
| 첫 답변 토큰 | 11.5초 | **4.2초** |
| 전체 완료 | 11.5초 | 11.6초 |

### 전 기능 QA 스윕에서 고친 것

| 문제 | 증상 | 수정 |
|---|---|---|
| Skill Gap 막다른 길 | 설치·장착됐지만 **비활성화**된 Skill 은 라우팅에서 빠져 계속 "부족한 Skill" 로 잡히는데, 설치 버튼은 이미 설치돼 있다는 이유로 아무 일도 하지 않아 같은 안내가 무한 반복 | `installSkills()` 가 비활성 Skill 을 다시 활성화 |
| 꺼진 Skill 이 소리 없이 사라짐 | 비활성화한 Skill 이 Agent Chat 사이드바에서 아예 안 보여, 왜 안 쓰이는지 알 수 없음 | 사이드바에 OFF 섹션으로 표시 + My Skills 링크 |
| 설치/장착 용어 혼용 | Skill Shop 버튼이 "장착하기" 라고 하지만 실제로는 설치만 함. README 는 설치(Shop→My Skills)와 장착(My Skills→Agent)을 구분(§28 Flow B) | 버튼을 "설치하기 / 설치됨·삭제" 로 정정, Skill Detail 에 "아직 Agent 에 장착되지 않았습니다" 안내 추가 |

정상 동작을 확인한 항목: Persona 매칭 4종, 전 화면 렌더링(9개), Skill Shop 필터·검색·정렬,
Skill 0개 Agent 대화, Skill 제거 시 Agent 연동 해제, Agent 삭제 시 대화기록 정리,
Custom Skill 생성→장착→실행, 404 처리, 채팅 Enter 전송.

### LLM 응답 품질 (claude-opus-5, 9개 케이스 전수)

평가 하네스는 각 질문마다 라우팅된 Skill · Skill 원본 결과 · 최종 답변을 나란히 출력해 대조합니다.

| 검증 항목 | 결과 |
|---|---|
| Calculator 값 인용 | 만기 수령액 `3,657,740원`, 원금·이자·세금 전부 계산값 그대로 인용 |
| 소비 분석 인용 | 저축률 33.3%, 고정비 35.0%, 절감 가능 10만원 — 재계산 없이 인용 |
| 검색 결과 환각 | 없음. 공고명·보증금·마감일이 모두 시드 데이터와 일치 |
| 금융사기 판정 | 위험 점수 95점(높음), 탐지 신호 3건과 대응 절차 정확 |
| Skill Gap 안내 | 부족 Skill(목표저축 플래너)을 답변 말미에 자연어로 안내 |
| Skill 없는 질문 ("오늘 날씨") | 지어내지 않고 기능 없음을 밝힌 뒤 기상청 안내 |
| 투자자문 회피 ("삼성전자 사도 될까") | 종목 판단 거절, 판단 기준만 제시 (§23 준수) |
| 실행 범위 고지 | "신청·접수는 대신 할 수 없다"를 상황에 맞게 반복 고지 |

---

## 9. 현재 한계 / 다음 단계

1. **외부 API 미연동** — SH / LH / 한국장학재단 / 온통청년 데이터는 목업 시드입니다.
   `src/lib/agent/executor.ts` 의 각 핸들러에서 시드 배열을 `fetch` 로 바꾸면 나머지 파이프라인은 그대로 동작합니다.
2. **전체 응답 완료까지는 여전히 10~20초** — 스트리밍으로 체감 지연은 해결했지만(첫 콘텐츠 2.7초),
   전체 완료 시간 자체는 그대로입니다. 더 줄이려면 effort 하향, 또는 라우팅을 규칙 기반으로 고정하고
   LLM 은 설명에만 사용하는 방법이 있습니다.
3. **인증·다중 사용자 없음** — 단일 데모 사용자 파일 스토어입니다. Supabase Auth + Postgres 로 이전 시
   `src/lib/store.ts` 의 함수 시그니처를 유지한 채 내부만 교체하면 됩니다.
4. **RAG 는 키워드 검색** — pgvector 임베딩 대신 별칭 기반 스코어링입니다. (§32 의 pgvector 는 미적용)
5. **미구현 (README에 정의되어 있으나 MVP 필수 목록 밖)** — Skill Fusion(§18), Export/Adapter Layer(§24·§25),
   Recipe 실행 엔진(현재 Recipe 는 정의·설치·Agent Builder 선택까지만).
