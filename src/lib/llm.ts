import Anthropic from "@anthropic-ai/sdk";

/**
 * LLM 접근 계층.
 *
 * ANTHROPIC_API_KEY 가 있으면 실제 Claude 를 호출하고,
 * 없으면 호출부가 결정론적 Fallback 으로 자동 전환한다.
 * (Skill Routing / Skill Gap / Trace 는 키 없이도 동작해야 하므로 강제하지 않는다.)
 */

export const MODEL = process.env.FINSKILL_MODEL ?? "claude-opus-5";

let client: Anthropic | null = null;

export function llmAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic | null {
  if (!llmAvailable()) return null;
  if (!client) {
    // identity-linked API key 는 요청이 어느 워크스페이스에서 이뤄지는지를
    // anthropic-workspace-id 헤더로 함께 보내야 한다.
    // (없으면 400 invalid_request_error 가 발생한다.)
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      ...(workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {}),
    });
  }
  return client;
}

export async function complete(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  /** 낮을수록 빠르고 저렴하다. 라우팅처럼 단순한 작업은 low 로 충분하다. */
  effort?: "low" | "medium" | "high";
}): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  try {
    // 주의:
    // - temperature/top_p 는 이 세대 모델에서 제거되었다 (보내면 400).
    //   출력 편차 조절은 output_config.effort 로 한다.
    // - 이 모델들은 thinking 이 기본 활성화이고 thinking 토큰도 max_tokens 를
    //   소비하므로, 예산을 넉넉히 잡지 않으면 본문이 잘린다.
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 8000,
      system: opts.system,
      output_config: { effort: opts.effort ?? "medium" },
      messages: [{ role: "user", content: opts.user }],
    });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  } catch (err) {
    console.error("[finskill] LLM 호출 실패 — fallback 으로 전환합니다.", err);
    return null;
  }
}

/** 모델 응답에서 첫 번째 JSON 객체를 안전하게 추출한다. */
export function extractJson<T>(text: string | null): T | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(body.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
