import Anthropic from "@anthropic-ai/sdk";

/**
 * LLM 접근 계층.
 *
 * ANTHROPIC_API_KEY 가 있으면 실제 Claude 를 호출하고,
 * 없으면 호출부가 결정론적 Fallback 으로 자동 전환한다.
 * (Skill Routing / Skill Gap / Trace 는 키 없이도 동작해야 하므로 강제하지 않는다.)
 */

export const MODEL = process.env.FINSKILL_MODEL ?? "claude-sonnet-5";

let client: Anthropic | null = null;

export function llmAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic | null {
  if (!llmAvailable()) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function complete(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1200,
      temperature: opts.temperature ?? 0.3,
      system: opts.system,
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
