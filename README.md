# 20FIN

> **20대의 다음을 준비하는 AI 금융 Agent**
> Life Event를 이해하고, 필요한 금융정보와 행동을 필요한 순간에.

20FIN은 20대에 연속으로 발생하는 대학·졸업·취업·첫 월급·학자금·독립 등의 **Life Event를 하나의 시간축(Timeline)으로 이해**하고, 각 시점에 챙겨야 할 금융 체크포인트(Fin Event)를 자동으로 만들어 **지금 해야 할 것만 필요한 순간에** 제안하는 Timeline-aware AI 금융 서비스다.

```
Life Event → Fin Event → Right Timing → Financial Action
```

전체 서비스 설계는 **[docs/design-spec.md](docs/design-spec.md)** 를 참고.

---

## 핵심 화면

| 경로 | 화면 | 역할 |
| --- | --- | --- |
| `/onboarding` | 내 20대 그리기 | 현재 상태 입력 → Life Event 추가 → Fin Event 자동 생성 |
| `/` | 나의 20대 | Path형 Timeline + Right Now 패널(지금 챙길 것·마감·기회) |
| `/opportunities` | 지금의 기회 | 청년정책·LH·장학금을 Timeline 기준으로 개인화 랭킹 |
| `/ask` | AI에게 물어보기 | Timeline Context를 아는 Agent 피오 + Decision UI |
| `/me` | 내 정보 | 프로필·초기화 |

---

## 아키텍처

- **도메인** (`src/lib/domain/`) — Life Event / Fin Event / Opportunity / Readiness 모델과 순수 로직
  - `timeline.ts` 타입·날짜 유틸 · `fin-events.ts` 체크포인트 생성 · `readiness.ts` 준비도 · `opportunity-rank.ts` 개인화 랭킹(Fit×Timing×Actionability)
- **상태** — 서버는 무상태. 사용자 상태(User·Life/Fin Event·대화)는 브라우저 `localStorage` (`components/timeline/TimelineStore.tsx`). Supabase 이전 시 이 파일만 교체.
- **백엔드 API** (`src/app/api/`)
  - `GET /api/opportunities` — 청년정책·LH 실시간 조회 + 장학금 실데이터를 Opportunity로 정규화
  - `POST /api/ask` — Timeline Context를 주입한 Agent 피오(구조화 Decision 출력)
- **데이터 소스** (`src/lib/agent/`) — 온통청년 청년정책, LH 공고, 한국장학재단 장학금

책임 분리(설계 §40): 시점 계산·랭킹·준비도는 **규칙/계산기**가, 자연어 이해·설명·판단 제시는 **LLM**이 담당한다.

---

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

빌드 / 검사:

```bash
npm run build
npm run typecheck
```

### 환경변수 (`.env.example` 참고)

| 변수 | 필수 | 용도 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | 선택 | 피오 대화(없으면 안내 메시지로 대체) |
| `ANTHROPIC_WORKSPACE_ID` | 조건부 | identity-linked 키 사용 시 |
| `YOUTH_CENTER_API_KEY` | 선택 | 청년정책 실시간 조회 |
| `DATA_GO_KR_SERVICE_KEY` | 선택 | LH 주거공고 실시간 조회 |
| `TWENTYFIN_MODEL` | 선택 | 모델 지정(기본 `claude-opus-5`) |

> 키가 없어도 장학금(실데이터)·Timeline·준비도 등 핵심 기능은 동작한다.

---

## 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Anthropic SDK
