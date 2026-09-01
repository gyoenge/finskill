"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";

async function post(url: string, body: unknown, method = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "DELETE" ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "요청 실패");
  return res.json();
}

/** Skill 설치 = Snap (§29 UI Metaphor) */
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
  const router = useRouter();
  const [pending, start] = useTransition();
  const [snapped, setSnapped] = useState(false);

  if (installed) {
    return (
      <Button
        variant="secondary"
        size={size}
        className={fullWidth ? "w-full" : ""}
        disabled={pending}
        onClick={() =>
          start(async () => {
            await post("/api/skills", { action: "uninstall", skillId });
            router.refresh();
          })
        }
      >
        {pending ? "해제 중…" : "장착됨 · 제거"}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      className={`${fullWidth ? "w-full" : ""} ${snapped ? "snap-in" : ""}`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await post("/api/skills", { action: "install", skillIds: [skillId] });
          setSnapped(true);
          router.refresh();
        })
      }
    >
      {pending ? "장착 중…" : "＋ 장착하기"}
    </Button>
  );
}

export function InstallKitButton({ skillIds, label = "FinKit 한 번에 설치" }: { skillIds: string[]; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="md"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await post("/api/skills", { action: "install", skillIds });
          router.refresh();
        })
      }
    >
      {pending ? "설치 중…" : `🧩 ${label} (${skillIds.length})`}
    </Button>
  );
}

export function ToggleSkill({ skillId, enabled }: { skillId: string; enabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Skill 비활성화" : "Skill 활성화"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await post("/api/skills", { action: "toggle", skillId, enabled: !enabled });
          router.refresh();
        })
      }
      className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-brand-500" : "bg-line"} ${
        pending ? "opacity-50" : ""
      }`}
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
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await post("/api/skills", { action: "uninstall", skillId });
          router.refresh();
        })
      }
    >
      삭제
    </Button>
  );
}

export function DeleteAgentButton({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await post(`/api/agents/${agentId}`, {}, "DELETE");
          router.refresh();
        })
      }
    >
      {pending ? "삭제 중…" : "삭제"}
    </Button>
  );
}

export function ResetDemoButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await post("/api/state", {}, "DELETE");
          router.refresh();
          router.push("/onboarding");
        })
      }
    >
      {pending ? "초기화 중…" : "데모 초기화"}
    </Button>
  );
}

export { post };
