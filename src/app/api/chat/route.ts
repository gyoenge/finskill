import { NextResponse } from "next/server";
import type { Agent, ChatMessage, Skill } from "@/lib/types";
import { runAgent } from "@/lib/agent/runtime";
import { llmAvailable } from "@/lib/llm";
import { SKILLS } from "@/lib/data/skills";

/**
 * Agent Chat 엔드포인트 — README §33 Agent Runtime 진입점.
 *
 * 서버는 무상태다. 사용자 상태는 브라우저 localStorage 에 있으므로,
 * 클라이언트가 이번 요청에 필요한 것(Agent 설정, 장착 Skill, 최근 대화)만 함께 보낸다.
 * 대화 기록 저장도 클라이언트가 한다.
 *
 * Server-Sent Events 로 진행 상황을 흘려보낸다. 이벤트 순서는
 *   trace → gap? → delta* → done
 * 이며, 스트리밍 도중 LLM 이 끊기면 reset 으로 부분 텍스트를 버린 뒤 Fallback 을 보낸다.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    agent: Agent;
    /** 장착 + 활성화된 Skill (Custom Skill 포함) */
    equipped: Skill[];
    /** 설치 가능한 전체 카탈로그 — Skill Gap 탐지에 쓰인다 */
    customSkills?: Skill[];
    history?: ChatMessage[];
    message: string;
    extraParams?: Record<string, unknown>;
  };

  const { agent, equipped, customSkills = [], history = [], message, extraParams } = body;

  if (!agent?.id) return NextResponse.json({ error: "Agent 정보가 없습니다." }, { status: 400 });
  if (!message?.trim()) return NextResponse.json({ error: "메시지가 비어 있습니다." }, { status: 400 });

  const catalog = [...SKILLS, ...customSkills];
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // 클라이언트가 연결을 끊은 경우 — 무시한다.
        }
      };

      try {
        const { message: agentMessage, usedSkillIds } = await runAgent({
          agent,
          query: message.trim(),
          equipped: equipped ?? [],
          catalog,
          history,
          extraParams,
          hooks: {
            onTrace: (trace) => send({ type: "trace", trace }),
            onGap: (gap) => send({ type: "gap", gap }),
            onDelta: (text) => send({ type: "delta", text }),
            onReset: () => send({ type: "reset" }),
          },
        });

        send({ type: "done", message: agentMessage, usedSkillIds, llm: llmAvailable() });
      } catch (err) {
        console.error("[finskill] Agent 실행 실패", err);
        send({ type: "error", error: "응답 생성에 실패했습니다. 잠시 후 다시 시도해주세요." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // 프록시 버퍼링을 끈다. 없으면 스트리밍이 무의미해진다.
      "X-Accel-Buffering": "no",
    },
  });
}
