import Link from "next/link";
import { notFound } from "next/navigation";
import { allSkills, readState } from "@/lib/store";
import { llmAvailable } from "@/lib/llm";
import { ChatClient } from "@/components/ChatClient";

/** 화면 07. Agent Chat */
export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = readState();
  const agent = state.agents.find((a) => a.id === id);
  if (!agent) notFound();

  const catalog = allSkills(state);
  const enabled = new Set(state.installed.filter((i) => i.enabled).map((i) => i.skillId));
  const equipped = agent.skillIds
    .filter((sid) => enabled.has(sid))
    .map((sid) => catalog.find((c) => c.id === sid))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // 장착은 되어 있지만 My Skills 에서 꺼둔 Skill.
  // 사이드바에서 아예 숨기면 "왜 이 Skill 이 안 쓰이지?" 를 알 길이 없으므로 OFF 로 표시한다.
  const disabled = agent.skillIds
    .filter((sid) => !enabled.has(sid))
    .map((sid) => catalog.find((c) => c.id === sid))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="space-y-4">
      <Link href="/agents" className="inline-block text-[12px] font-semibold text-ink-400 hover:text-brand-700">
        ← My Agent
      </Link>
      <ChatClient
        agent={agent}
        equipped={equipped}
        disabled={disabled}
        initialMessages={state.chats[agent.id] ?? []}
        llmEnabled={llmAvailable()}
      />
    </div>
  );
}
