import { NextResponse } from "next/server";
import type { ChatMessage } from "@/lib/types";
import { runAgent } from "@/lib/agent/runtime";
import { allSkills, appendMessages, noteRecentSkills, readState } from "@/lib/store";
import { llmAvailable } from "@/lib/llm";

/** Agent Chat 엔드포인트 — README §33 Agent Runtime 진입점 */
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

  const { message: agentMessage, usedSkillIds } = await runAgent({
    agent,
    query: message.trim(),
    equipped,
    catalog,
    history: state.chats[agentId] ?? [],
    extraParams,
  });

  appendMessages(agentId, [userMessage, agentMessage]);
  if (usedSkillIds.length) noteRecentSkills(usedSkillIds);

  return NextResponse.json({
    userMessage,
    agentMessage,
    llm: llmAvailable(),
  });
}
