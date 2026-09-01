"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { FinKit, PersonaProfile, Recipe, Skill } from "@/lib/types";
import { Button, Card } from "@/components/ui";
import { SkillDna } from "@/components/SkillDna";
import { useStore } from "@/components/StoreProvider";
import * as ops from "@/lib/state-ops";

/** 화면 06. Agent Builder (README §11, Flow D) */
export function AgentBuilder({
  catalog,
  personas,
  kits,
  recipes,
  suggestedPersonaId,
}: {
  catalog: Skill[];
  personas: PersonaProfile[];
  kits: FinKit[];
  recipes: Recipe[];
  suggestedPersonaId: string | null;
}) {
  const router = useRouter();
  const { state, update } = useStore();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const suggested = personas.find((p) => p.id === suggestedPersonaId) ?? personas[0];
  const [name, setName] = useState(suggested.defaultAgentName);
  const [persona, setPersona] = useState(suggested.summary);
  const [instructions, setInstructions] = useState(suggested.defaultInstructions);
  const [selected, setSelected] = useState<string[]>(
    kits.find((k) => k.persona === suggested.id)?.skillIds ?? [],
  );

  const selectedSkills = useMemo(
    () => catalog.filter((s) => selected.includes(s.id)),
    [catalog, selected],
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const applyPersona = (p: PersonaProfile) => {
    setName(p.defaultAgentName);
    setPersona(p.summary);
    setInstructions(p.defaultInstructions);
    setSelected(kits.find((k) => k.persona === p.id)?.skillIds ?? []);
  };

  const create = () =>
    start(() => {
      setError("");
      // 새 Agent id 를 즉시 써야 하므로 상태 전이를 먼저 계산한다.
      const { state: next, agent } = ops.createAgent(state, {
        name: name.trim(),
        persona: persona.trim() || "개인 금융 도우미",
        instructions: instructions.trim() || "사용자의 금융 문제를 쉽게 설명하고 해결을 돕는다.",
        model: "claude-opus-5",
        skillIds: selected,
      });
      update(() => next);
      router.push(`/agents/${agent.id}/chat`);
    });

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <Step n={1} title="Agent 이름">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 나의 대학생활 금융비서"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13.5px] outline-none focus:border-brand-400"
          />
        </Step>

        <Step n={2} title="Persona 설정">
          <div className="flex flex-wrap gap-1.5">
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPersona(p)}
                className={`rounded-xl border px-3 py-1.5 text-[12.5px] font-medium transition ${
                  persona === p.summary
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-line bg-surface text-ink-500 hover:border-brand-300"
                }`}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
          <input
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Agent 가 어떤 존재인지 한 줄로"
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] outline-none focus:border-brand-400"
          />
        </Step>

        <Step n={3} title="Skill 선택" hint={`${selected.length}개 선택됨`}>
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {kits.map((k) => (
              <button
                key={k.id}
                onClick={() => setSelected((prev) => Array.from(new Set([...prev, ...k.skillIds])))}
                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-ink-500 transition hover:border-brand-300 hover:text-brand-700"
              >
                📦 {k.name} 추가
              </button>
            ))}
            {recipes.map((r) => (
              <button
                key={r.id}
                onClick={() =>
                  setSelected((prev) => Array.from(new Set([...prev, ...r.steps.map((s) => s.skillId)])))
                }
                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-ink-500 transition hover:border-accent-400 hover:text-accent-700"
              >
                🧪 {r.name}
              </button>
            ))}
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="rounded-lg px-2.5 py-1 text-[11.5px] font-semibold text-ink-400 hover:text-risk-high"
              >
                전체 해제
              </button>
            )}
          </div>

          <ul className="grid max-h-96 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {catalog.map((s) => {
              const on = selected.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    onClick={() => toggle(s.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition ${
                      on ? "border-brand-500 bg-brand-50" : "border-line bg-surface hover:border-brand-300"
                    }`}
                  >
                    <span
                      className={`puzzle-piece flex h-8 w-8 shrink-0 items-center justify-center text-[15px] ${
                        on ? "bg-white" : "bg-canvas"
                      }`}
                    >
                      {s.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-ink-900">{s.name}</span>
                      <span className="block truncate text-[11px] text-ink-400">{s.tagline}</span>
                    </span>
                    <span className={`shrink-0 text-[13px] ${on ? "text-brand-600" : "text-ink-300"}`}>
                      {on ? "✓" : "＋"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Step>

        <Step n={4} title="Agent 역할 설정">
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={5}
            placeholder="Agent 가 어떤 순서와 태도로 도와야 하는지 적어주세요."
            className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-brand-400"
          />
          <p className="mt-1.5 text-[11px] text-ink-400">
            이 지침은 Agent 의 system prompt 로 사용되며, Skill 실행 결과를 설명하는 방식에 영향을 줍니다.
          </p>
        </Step>

        {error && <p className="text-[12px] text-risk-high">{error}</p>}

        <Button size="lg" className="w-full" onClick={create} disabled={pending || !name.trim()}>
          {pending ? "생성 중…" : "STEP 5 · Agent 생성하기"}
        </Button>
      </div>

      {/* Agent Preview */}
      <div className="space-y-4">
        <Card className="p-4">
          <p className="text-[11px] font-bold tracking-wider text-ink-400">AGENT PREVIEW</p>
          <div className="mt-2.5 flex items-start gap-3">
            <div className="puzzle-piece flex h-12 w-12 shrink-0 items-center justify-center bg-brand-500 text-[22px]">
              🤖
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-ink-900">{name || "이름 없는 Agent"}</p>
              <p className="text-[12px] text-ink-500">{persona || "Persona 미설정"}</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-4 rounded-xl bg-canvas px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-500">
            {instructions || "역할 지침이 없습니다."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {selectedSkills.map((s) => (
              <span key={s.id} className="snap-in rounded-lg bg-canvas px-2 py-1 text-[11px] font-medium text-ink-700">
                {s.icon} {s.name}
              </span>
            ))}
            {selectedSkills.length === 0 && <span className="text-[11.5px] text-ink-300">선택된 Skill 이 없습니다.</span>}
          </div>
        </Card>

        <SkillDna skills={selectedSkills} catalog={catalog} compact />

        <Card className="p-4">
          <p className="text-[11px] font-bold tracking-wider text-ink-400">권한 미리보기</p>
          <ul className="mt-2 space-y-1 text-[11.5px] text-ink-700">
            <li>
              개인정보 접근 · {selectedSkills.filter((s) => s.permissions.personalData).length}개 Skill
            </li>
            <li>
              외부 통신 · {new Set(selectedSkills.flatMap((s) => s.permissions.network)).size}개 도메인
            </li>
            <li className="text-risk-low">금융 실행 · 없음</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500 text-[11px] font-bold text-white">
          {n}
        </span>
        <p className="text-[13px] font-bold text-ink-900">{title}</p>
        {hint && <span className="ml-auto text-[11.5px] font-semibold text-brand-600">{hint}</span>}
      </div>
      {children}
    </Card>
  );
}
