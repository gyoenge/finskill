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

  return (
    <div className="space-y-4">
      <Link href="/agents" className="inline-block text-[12px] font-semibold text-ink-400 hover:text-brand-700">
        ← My Agent
      </Link>
      <ChatClient
        agent={agent}
        equipped={equipped}
        initialMessages={state.chats[agent.id] ?? []}
        llmEnabled={llmAvailable()}
      />
    </div>
  );
}
