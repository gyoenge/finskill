import { NextResponse } from "next/server";
import type { ChatMessage } from "@/lib/types";
import { runAgent } from "@/lib/agent/runtime";
import { allSkills, appendMessages, noteRecentSkills, readState } from "@/lib/store";
import { llmAvailable } from "@/lib/llm";

/**
 * Agent Chat 엔드포인트 — README §33 Agent Runtime 진입점.
 *
 * Server-Sent Events 로 진행 상황을 흘려보낸다. 답변 생성에 10초 이상 걸리므로
 * 완성될 때까지 기다리면 화면이 멈춘 것처럼 보이기 때문이다. 이벤트 순서는
 *   user → trace → gap? → delta* → done
 * 이며, 각 이벤트는 `data: {json}\n\n` 한 줄이다.
 */
export async function POST(req: Request) {
  const { agentId, message, extraParams } = (await req.json()) as {
    agentId: string;
    message: string;
    extraParams?: Record<string, unknown>;
  };

  const state = readState();
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) return NextResponse.json({ error: "Agent 를 찾을 수 없습니다." }, { status: 404 });
  if (!message?.trim()) return NextResponse.json({ error: "메시지가 비어 있습니다." }, { status: 400 });

  const catalog = allSkills(state);
  const enabled = new Set(state.installed.filter((i) => i.enabled).map((i) => i.skillId));
  const equipped = agent.skillIds
    .filter((id) => enabled.has(id))
    .map((id) => catalog.find((c) => c.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const userMessage: ChatMessage = {
    id: `msg_${Date.now().toString(36)}_u`,
    role: "user",
    content: message.trim(),
    createdAt: new Date().toISOString(),
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // 클라이언트가 이미 연결을 끊은 경우 — 무시하고 계속 진행해 상태 저장은 마친다.
        }
      };

      send({ type: "user", message: userMessage });

      try {
        const { message: agentMessage, usedSkillIds } = await runAgent({
          agent,
          query: message.trim(),
          equipped,
          catalog,
          history: state.chats[agentId] ?? [],
          extraParams,
          hooks: {
            onTrace: (trace) => send({ type: "trace", trace }),
            onGap: (gap) => send({ type: "gap", gap }),
            onDelta: (text) => send({ type: "delta", text }),
            onReset: () => send({ type: "reset" }),
          },
        });

        appendMessages(agentId, [userMessage, agentMessage]);
        if (usedSkillIds.length) noteRecentSkills(usedSkillIds);

        send({ type: "done", message: agentMessage, llm: llmAvailable() });
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
      // Nginx 등 리버스 프록시의 버퍼링을 끈다. 없으면 스트리밍이 무의미해진다.
      "X-Accel-Buffering": "no",
    },
  });
}
