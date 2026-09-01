"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Category, FinKit, OnboardingProfile, PersonaProfile } from "@/lib/types";
import { CATEGORY_LABEL, ONBOARDING_OPTIONS, PERSONA_MAP } from "@/lib/data/personas";
import { SKILL_MAP } from "@/lib/data/skills";
import { Button, Card } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";
import { matchPersona, recommendKit } from "@/lib/recommend";
import * as ops from "@/lib/state-ops";

/** Agent 카드에 표시할 모델 이름 (실제 호출 모델은 서버가 결정한다) */
const MODEL_LABEL = "claude-opus-5";

/**
 * Flow A: 처음 사용하는 사용자 (README §28)
 * Persona 설정 → 추천 FinKit → Skill 확인 → Agent 자동 생성 → Chat 시작
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { state, update } = useStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState<OnboardingProfile>({
    age: "23~26세",
    status: "대학생",
    region: "서울",
    housing: "자취",
    interests: ["housing", "wealth", "education"],
    knowledge: "기초",
  });

  const [result, setResult] = useState<{
    persona: PersonaProfile;
    reason: string;
    kit: FinKit;
  } | null>(null);

  const toggleInterest = (c: Category) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(c) ? f.interests.filter((x) => x !== c) : [...f.interests, c],
    }));

  // Persona 매칭은 순수 계산이라 서버가 필요 없다 (§9 규칙 기반).
  const submitProfile = () => {
    setError("");
    const { personaId, reason } = matchPersona(form);
    const kit = recommendKit(personaId);
    update((s) => ops.setProfile(s, form, personaId));
    setResult({ persona: PERSONA_MAP[personaId], reason, kit });
    setStep(2);
  };

  const createAgent = () =>
    start(() => {
      if (!result) return;
      setError("");
      // 새 Agent id 를 즉시 알아야 이동할 수 있으므로, 상태 전이를 먼저 계산한 뒤 반영한다.
      // (update 의 갱신 함수는 React 가 나중에 실행하므로 그 안에서 꺼낸 값은 여기서 읽을 수 없다.)
      const { state: next, agent } = ops.createAgent(state, {
        name: result.persona.defaultAgentName,
        persona: result.persona.summary,
        instructions: result.persona.defaultInstructions,
        model: MODEL_LABEL,
        skillIds: result.kit.skillIds,
      });
      update(() => next);
      router.push(`/agents/${agent.id}/chat`);
    });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="text-center">
        <p className="text-[12px] font-bold tracking-widest text-brand-600">DISCOVER · SNAP · SOLVE</p>
        <h1 className="mt-1.5 text-[24px] font-extrabold tracking-tight text-ink-900">
          {step === 1 ? "어떤 금융 능력이 필요한가요?" : `${result?.persona.name} Persona 로 시작합니다`}
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-500">
          {step === 1
            ? "몇 가지만 알려주시면 필요한 Skill 을 골라드립니다."
            : result?.reason}
        </p>
      </header>

      {step === 1 && (
        <Card className="space-y-5 p-5">
          <Field label="연령대">
            <Choices options={[...ONBOARDING_OPTIONS.age]} value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
          </Field>
          <Field label="현재 상태">
            <Choices options={[...ONBOARDING_OPTIONS.status]} value={form.status} onChange={(v) => setForm({ ...form, status: v })} />
          </Field>
          <Field label="거주 지역">
            <Choices options={[...ONBOARDING_OPTIONS.region]} value={form.region} onChange={(v) => setForm({ ...form, region: v })} />
          </Field>
          <Field label="주거 형태">
            <Choices options={[...ONBOARDING_OPTIONS.housing]} value={form.housing} onChange={(v) => setForm({ ...form, housing: v })} />
          </Field>
          <Field label="주요 금융 관심사 (복수 선택)">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleInterest(c)}
                  className={`rounded-xl border px-3 py-1.5 text-[12.5px] font-medium transition ${
                    form.interests.includes(c)
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-line bg-surface text-ink-500 hover:border-brand-300"
                  }`}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="금융 지식 수준">
            <Choices
              options={[...ONBOARDING_OPTIONS.knowledge]}
              value={form.knowledge}
              onChange={(v) => setForm({ ...form, knowledge: v })}
            />
          </Field>

          {error && <p className="text-[12px] text-risk-high">{error}</p>}
          <Button size="lg" className="w-full" onClick={submitProfile} disabled={pending}>
            {pending ? "분석 중…" : "내게 맞는 Skill 찾기"}
          </Button>
        </Card>
      )}

      {step === 2 && result && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="puzzle-piece flex h-14 w-14 shrink-0 items-center justify-center bg-brand-50 text-[26px]">
                {result.kit.icon}
              </div>
              <div>
                <p className="text-[16px] font-bold text-ink-900">{result.kit.name}</p>
                <p className="text-[12.5px] text-ink-500">{result.kit.tagline}</p>
              </div>
            </div>
            <p className="mt-3 rounded-xl bg-canvas px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-700">
              {result.kit.reason}
            </p>
            <ul className="mt-3 space-y-1.5">
              {result.kit.skillIds.map((id) => {
                const s = SKILL_MAP[id];
                if (!s) return null;
                return (
                  <li key={id} className="snap-in flex items-center gap-2.5 rounded-xl border border-line px-3 py-2">
                    <span className="puzzle-piece flex h-8 w-8 items-center justify-center bg-brand-50 text-[15px]">
                      {s.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold text-ink-900">{s.name}</p>
                      <p className="truncate text-[11px] text-ink-400">{s.tagline}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="p-5">
            <p className="text-[13px] font-bold text-ink-900">자동으로 만들어질 Agent</p>
            <p className="mt-1.5 text-[13px] text-brand-700">🤖 {result.persona.defaultAgentName}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{result.persona.defaultInstructions}</p>
          </Card>

          {error && <p className="text-[12px] text-risk-high">{error}</p>}

          <div className="flex gap-2">
            <Button variant="secondary" size="lg" onClick={() => setStep(1)} disabled={pending}>
              다시 설정
            </Button>
            <Button size="lg" className="flex-1" onClick={createAgent} disabled={pending}>
              {pending ? "Agent 생성 중…" : "🧩 Skill 장착하고 Agent 시작하기"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[12.5px] font-bold text-ink-900">{label}</p>
      {children}
    </div>
  );
}

function Choices({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-xl border px-3 py-1.5 text-[12.5px] font-medium transition ${
            value === o
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-line bg-surface text-ink-500 hover:border-brand-300"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
