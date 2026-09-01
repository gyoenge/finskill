"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";
import * as ops from "@/lib/state-ops";

/**
 * 상태를 바꾸는 UI 조각들.
 *
 * 서버는 무상태이므로 여기서 localStorage 를 직접 갱신한다.
 * 실제 상태 전이는 src/lib/state-ops.ts 의 순수 함수가 수행한다.
 */

/**
 * Skill Shop / Detail 의 설치 버튼.
 *
 * README 는 "설치"(Shop → My Skills)와 "장착"(My Skills → Agent)을 구분한다(§28 Flow B).
 * 이 버튼은 설치만 하므로 장착이라고 부르지 않는다.
 */
export function InstallButton({
  skillId,
  installed,
  size = "sm",
  fullWidth = false,
}: {
  skillId: string;
  installed: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  const { update } = useStore();
  const [snapped, setSnapped] = useState(false);

  if (installed) {
    return (
      <Button
        variant="secondary"
        size={size}
        className={fullWidth ? "w-full" : ""}
        onClick={() => update((s) => ops.uninstallSkill(s, skillId))}
      >
        설치됨 · 삭제
      </Button>
    );
  }

  return (
    <Button
      size={size}
      className={`${fullWidth ? "w-full" : ""} ${snapped ? "snap-in" : ""}`}
      onClick={() => {
        update((s) => ops.installSkills(s, [skillId]));
        setSnapped(true);
      }}
    >
      ＋ 설치하기
    </Button>
  );
}

export function InstallKitButton({
  skillIds,
  label = "FinKit 한 번에 설치",
}: {
  skillIds: string[];
  label?: string;
}) {
  const { update } = useStore();
  return (
    <Button size="md" onClick={() => update((s) => ops.installSkills(s, skillIds))}>
      🧩 {label} ({skillIds.length})
    </Button>
  );
}

export function ToggleSkill({ skillId, enabled }: { skillId: string; enabled: boolean }) {
  const { update } = useStore();
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Skill 비활성화" : "Skill 활성화"}
      onClick={() => update((s) => ops.toggleSkill(s, skillId, !enabled))}
      className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-brand-500" : "bg-line"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          enabled ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function RemoveSkillButton({ skillId }: { skillId: string }) {
  const { update } = useStore();
  return (
    <Button variant="ghost" size="sm" onClick={() => update((s) => ops.uninstallSkill(s, skillId))}>
      삭제
    </Button>
  );
}

export function DeleteAgentButton({ agentId }: { agentId: string }) {
  const { update } = useStore();
  return (
    <Button variant="ghost" size="sm" onClick={() => update((s) => ops.deleteAgent(s, agentId))}>
      삭제
    </Button>
  );
}

export function ResetDemoButton() {
  const router = useRouter();
  const { reset } = useStore();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        reset();
        router.push("/onboarding");
      }}
    >
      데모 초기화
    </Button>
  );
}
