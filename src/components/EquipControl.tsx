"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Agent } from "@/lib/types";
import { post } from "@/components/actions";

/** My Skills 에서 Skill 을 Agent 에 장착(Snap)/해제(Detach) 한다 (README §10) */
export function EquipControl({ skillId, agents }: { skillId: string; agents: Agent[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!agents.length) {
    return <span className="text-[11px] text-ink-300">Agent 없음</span>;
  }

  const toggle = (agent: Agent) =>
    start(async () => {
      const has = agent.skillIds.includes(skillId);
      await post(
        `/api/agents/${agent.id}`,
        { skillIds: has ? agent.skillIds.filter((s) => s !== skillId) : [...agent.skillIds, skillId] },
        "PATCH",
      );
      router.refresh();
    });

  return (
    <div className="flex flex-wrap gap-1">
      {agents.map((a) => {
        const on = a.skillIds.includes(skillId);
        return (
          <button
            key={a.id}
            onClick={() => toggle(a)}
            disabled={pending}
            title={on ? `${a.name} 에서 해제` : `${a.name} 에 장착`}
            className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
              on
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-line bg-surface text-ink-400 hover:border-brand-300"
            }`}
          >
            {on ? "🧩" : "＋"} {a.name}
          </button>
        );
      })}
    </div>
  );
}
