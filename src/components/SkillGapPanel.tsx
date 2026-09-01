"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SkillGap } from "@/lib/types";
import { Button } from "@/components/ui";
import { post } from "@/components/actions";

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
  const router = useRouter();
  const [pending, start] = useTransition();
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
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await post("/api/skills", {
                    action: "install",
                    skillIds: gap.missing.map((m) => m.skillId),
                    agentId,
                  });
                  setDone(true);
                  router.refresh();
                  onContinue(lastQuery);
                })
              }
            >
              {pending ? "장착하는 중…" : "추천 Skill 장착하고 계속하기"}
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
