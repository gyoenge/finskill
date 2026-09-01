"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore, Loading } from "@/components/StoreProvider";
import { ChatClient } from "@/components/ChatClient";

/** 화면 07. Agent Chat */
export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, catalog } = useStore();
  const agent = state.agents.find((a) => a.id === id);

  if (!ready) return <Loading />;
  if (!agent) {
    return (
      <div className="py-16 text-center">
        <p className="text-[15px] font-semibold text-ink-900">존재하지 않는 Agent 입니다.</p>
        <Link href="/agents" className="mt-2 inline-block text-[13px] font-semibold text-brand-700 hover:underline">
          ← 나의 에이전트 로 돌아가기
        </Link>
      </div>
    );
  }

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
        ← 나의 에이전트
      </Link>
      <ChatClient
        agent={agent}
        equipped={equipped}
        disabled={disabled}
        initialMessages={state.chats[agent.id] ?? []}
      />
    </div>
  );
}
