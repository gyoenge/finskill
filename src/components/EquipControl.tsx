"use client";

import type { Agent } from "@/lib/types";
import { useStore } from "@/components/StoreProvider";
import * as ops from "@/lib/state-ops";

/** My Skills 에서 Skill 을 Agent 에 장착(Snap)/해제(Detach) 한다 (README §10) */
export function EquipControl({ skillId, agents }: { skillId: string; agents: Agent[] }) {
  const { update } = useStore();

  if (!agents.length) {
    return <span className="text-[11px] text-ink-300">Agent 없음</span>;
  }

  const toggle = (agent: Agent) => {
    const has = agent.skillIds.includes(skillId);
    const next = has ? agent.skillIds.filter((s) => s !== skillId) : [...agent.skillIds, skillId];
    update((s) => ops.equipSkills(s, agent.id, next));
  };

  return (
    <div className="flex flex-wrap gap-1">
      {agents.map((a) => {
        const on = a.skillIds.includes(skillId);
        return (
          <button
            key={a.id}
            onClick={() => toggle(a)}
            title={on ? `${a.name} 에서 해제` : `${a.name} 에 장착`}
            className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
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
