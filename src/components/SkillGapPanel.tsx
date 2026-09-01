"use client";

import { useState } from "react";
import type { SkillGap } from "@/lib/types";
import { Button } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";
import * as ops from "@/lib/state-ops";

/**
 * Skill Gap (README §14, Flow C)
 * 부족한 Skill 을 발견 → 추천 → 사용자 승인 → 장착 → 기존 요청 계속 실행
 */
export function SkillGapPanel({
  gap,
  agentId,
  lastQuery,
  onContinue,
}: {
  gap: SkillGap;
  agentId: string;
  lastQuery: string;
  onContinue: (query: string) => void;
}) {
  const { update } = useStore();
  const [done, setDone] = useState(false);

  if (done) return null;

  return (
    <div className="snap-in mt-2.5 rounded-2xl border border-accent-200 bg-accent-50 p-3.5">
      <div className="flex items-start gap-2">
        <span className="text-[16px]">🧩</span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-bold text-accent-700">{gap.message}</p>
          <ul className="mt-2 space-y-1.5">
            {gap.missing.map((m) => (
              <li key={m.skillId} className="flex items-start gap-2 rounded-xl bg-surface px-2.5 py-2">
                <span className="text-[15px]">{m.icon}</span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-ink-900">{m.name}</p>
                  <p className="text-[11px] leading-relaxed text-ink-500">{m.reason}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                const ids = gap.missing.map((m) => m.skillId);
                update((s) => {
                  // 설치(비활성이면 재활성화)한 뒤 이 Agent 에 장착한다.
                  const installed = ops.installSkills(s, ids);
                  const agent = installed.agents.find((a) => a.id === agentId);
                  if (!agent) return installed;
                  const next = Array.from(new Set([...agent.skillIds, ...ids]));
                  return ops.equipSkills(installed, agentId, next);
                });
                setDone(true);
                onContinue(lastQuery);
              }}
            >
              추천 Skill 장착하고 계속하기
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDone(true)}>
              지금은 괜찮아요
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
