import { NextResponse } from "next/server";
import { complete, extractJson, llmAvailable } from "@/lib/llm";
import type { Decision } from "@/lib/domain/state";
import type { FinancialContext, FinEvent, LifeEvent, User } from "@/lib/domain/timeline";

/**
 * POST /api/ask — Timeline-aware Agent 피오 (설계 §30~§32·§52).
 *
 * 서버는 무상태다. 클라이언트가 이번 대화에 필요한 Timeline Context 를 함께 보낸다.
 * 프롬프트에 User + Timeline + Financial Context + 관련 Fin Event 를 주입한다.
 * LLM 은 선택지·판단 기준만 제시하고, 상품 가입·투자자문·수치 날조는 금지한다(설계 §75).
 */

const STATUS_LABEL: Record<string, string> = {
  student: "대학생",
  job_seeker: "취업 준비",
  employee: "직장인",
  freelancer: "프리랜서",
  other: "기타",
};
const LIVING_LABEL: Record<string, string> = { family: "본가", dorm: "기숙사", alone: "자취", other: "기타" };
const CERTAINTY_LABEL: Record<string, string> = { confirmed: "확정", expected: "예상", goal: "목표" };
const STATUS_KO: Record<string, string> = { past: "과거", current: "현재", future: "예정" };

interface AskBody {
  message: string;
  context: {
    user: User | null;
    lifeEvents: LifeEvent[];
    finEvents: FinEvent[];
    financialContext: FinancialContext | null;
  };
  lifeEventId?: string;
  history?: { role: "user" | "agent"; content: string }[];
}

function buildContext(ctx: AskBody["context"], lifeEventId?: string): string {
  const { user, lifeEvents, finEvents, financialContext } = ctx;
  const now = new Date();
  const age = user ? now.getFullYear() - user.birthYear : null;

  const userLine = user
    ? `- ${age ? `만 ${age}세` : ""} · 상태 ${STATUS_LABEL[user.currentStatus] ?? user.currentStatus}` +
      `${user.region ? ` · 지역 ${user.region}` : ""}${user.livingType ? ` · 거주 ${LIVING_LABEL[user.livingType] ?? ""}` : ""}`
    : "- (프로필 미입력)";

  const timeline = [...lifeEvents]
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
    .map((e) => `- ${e.date ?? "미정"} ${e.title} (${CERTAINTY_LABEL[e.certainty]}, ${STATUS_KO[e.status]})`)
    .join("\n");

  const checkpoints = finEvents
    .filter((f) => f.status === "pending")
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 8)
    .map((f) => `- ${f.dueDate ?? "미정"} ${f.title} (우선순위 ${f.priority})`)
    .join("\n");

  const fin = financialContext
    ? [
        financialContext.monthlyIncome ? `- 월 소득 약 ${Math.round(financialContext.monthlyIncome / 10000)}만원` : "",
        financialContext.monthlyExpense ? `- 월 지출 약 ${Math.round(financialContext.monthlyExpense / 10000)}만원` : "",
        financialContext.savings ? `- 저축 약 ${Math.round(financialContext.savings / 10000)}만원` : "",
        financialContext.emergencyFund ? `- 비상금 약 ${Math.round(financialContext.emergencyFund / 10000)}만원` : "",
        ...(financialContext.debts ?? []).map(
          (d) => `- 부채: ${d.type}${d.amount ? ` 약 ${Math.round(d.amount / 10000)}만원` : ""}${d.interestRate ? ` (금리 ${d.interestRate}%)` : ""}`,
        ),
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const focus = lifeEventId ? lifeEvents.find((e) => e.id === lifeEventId) : undefined;

  return [
    "[사용자]",
    userLine,
    "",
    "[Life Timeline]",
    timeline || "- (아직 입력한 Event 없음)",
    "",
    "[지금 챙길 금융 체크포인트]",
    checkpoints || "- (없음)",
    fin ? `\n[금융 프로필]\n${fin}` : "\n[금융 프로필]\n- (미입력 — 필요하면 사용자에게 되물을 것)",
    focus ? `\n[지금 집중하는 Event] ${focus.title} (${focus.date ?? "미정"})` : "",
  ].join("\n");
}

const SYSTEM = (contextBlock: string) => `너는 20FIN의 금융 Agent '피오'다. 사용자의 20대 Life Timeline을 이미 알고 있는 Timeline-aware 조언자다.

${contextBlock}

절대 규칙:
1. 위 Timeline·체크포인트·프로필의 사실을 근거로, 사용자의 다음 Life Event 준비 관점에서 답한다.
1-1. 질문과 관계있는 기본정보 또는 Timeline 사실을 답변에 최소 한 번 구체적으로 연결한다.
2. 특정 금융상품 가입을 권유하거나 투자자문·주식 종목 추천을 하지 않는다. 선택지와 판단 기준만 제시한다.
3. 위 정보에 없는 수치(금액·금리·마감일)를 지어내지 않는다. 판단에 필요한 숫자가 없으면 사용자에게 되묻는다.
4. 신청·계약·송금은 20FIN이 대신 할 수 없다는 점을 필요할 때 분명히 말한다.

반드시 아래 JSON 객체 하나만 출력한다. 다른 텍스트를 앞뒤에 붙이지 않는다.
{
  "answer": "한국어 존댓말 300자 내외. 결론을 첫 문장에. 항목이 여러 개면 '- ' 불릿 최대 4개.",
  "decision": null 또는 {
    "title": "추천 제목",
    "recommendation": "한 줄 핵심 추천",
    "options": [{"label":"전략명","columns":{"열이름":"값"},"note":"특징","recommended":true|false}],
    "why": ["이유1","이유2","이유3"]
  }
}
decision은 '무엇을 먼저 할지 / 얼마씩 나눌지' 같은 선택·배분 질문일 때만 채우고, 그 외에는 null로 둔다.
options의 columns는 모든 전략이 동일한 열 이름을 쓰고, 값이 없는 항목은 지어내지 말 것.`;

export async function POST(req: Request) {
  const body = (await req.json()) as AskBody;
  if (!body?.message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }
  if (!body.context?.user || !Array.isArray(body.context.lifeEvents) || !Array.isArray(body.context.finEvents)) {
    return NextResponse.json({ error: "onboarding context required" }, { status: 400 });
  }

  if (!llmAvailable()) {
    return NextResponse.json({
      answer:
        "지금은 AI 응답 키가 설정되지 않아 대화를 이어갈 수 없어요. 대신 왼쪽 '나의 20대'에서 Timeline과 지금 챙길 체크포인트를, '지금의 기회'에서 받을 수 있는 지원을 확인할 수 있어요.",
      decision: null,
    });
  }

  const contextBlock = buildContext(body.context, body.lifeEventId);
  const historyText = (body.history ?? [])
    .slice(-6)
    .map((m) => `${m.role === "user" ? "사용자" : "피오"}: ${m.content}`)
    .join("\n");
  const userMsg = historyText ? `[이전 대화]\n${historyText}\n\n[질문] ${body.message}` : body.message;

  const raw = await complete({ system: SYSTEM(contextBlock), user: userMsg, effort: "medium", maxTokens: 4000 });
  const parsed = extractJson<{ answer?: string; decision?: Decision | null }>(raw);

  if (!parsed?.answer) {
    // JSON 파싱 실패 시 원문을 그대로 답변으로 쓴다.
    return NextResponse.json({
      answer: raw?.trim() || "답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.",
      decision: null,
    });
  }

  return NextResponse.json({ answer: parsed.answer, decision: parsed.decision ?? null });
}
