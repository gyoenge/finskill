"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Category, SkillInput, SkillType } from "@/lib/types";
import { CATEGORY_LABEL, TYPE_LABEL } from "@/lib/data/personas";
import { Button, Card } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";
import * as ops from "@/lib/state-ops";

/** 화면 08. Skill Builder — No-code Custom Skill 제작 (README §21, §22) */
export default function SkillBuilderPage() {
  const router = useRouter();
  const { update } = useStore();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [tested, setTested] = useState(false);

  const [name, setName] = useState("월 예산 분석");
  const [icon, setIcon] = useState("🧮");
  const [description, setDescription] = useState(
    "월 수입과 고정지출을 입력하면 저축률과 가장 큰 지출 항목, 개선 가능 금액을 알려줍니다.",
  );
  const [category, setCategory] = useState<Category[]>(["spending"]);
  const [type, setType] = useState<SkillType[]>(["analyze"]);
  const [inputs, setInputs] = useState<{ label: string; kind: SkillInput["kind"] }[]>([
    { label: "월수입", kind: "money" },
    { label: "월세", kind: "money" },
    { label: "식비", kind: "money" },
  ]);
  const [outputs, setOutputs] = useState<string[]>(["저축률", "가장 큰 지출", "개선 가능 금액"]);
  const [dataSource, setDataSource] = useState("사용자 입력값");
  const [instruction, setInstruction] = useState(
    "저축률이 20% 미만이면 가장 큰 고정비부터 줄일 방법을 제안한다.",
  );
  const [personalData, setPersonalData] = useState(true);

  /** 플랫폼이 자동 변환하는 Skill Manifest 미리보기 (§22) */
  const manifest = useMemo(
    () =>
      [
        `id: custom-<자동생성>`,
        `name: ${name || "(이름 없음)"}`,
        `version: 0.1.0`,
        ``,
        `category:`,
        ...(category.length ? category.map((c) => `  - ${c}`) : ["  - literacy"]),
        ``,
        `type:`,
        ...(type.length ? type.map((t) => `  - ${t}`) : ["  - analyze"]),
        ``,
        `permissions:`,
        `  network: []`,
        `  personal_data: ${personalData}`,
        `  write_action: false`,
        `  financial_transaction: false`,
        ``,
        `risk:`,
        `  level: ${personalData ? "medium" : "low"}`,
        ``,
        `executor:`,
        `  type: calculator`,
        ``,
        `source:`,
        `  organization: ${dataSource || "사용자 입력값"}`,
      ].join("\n"),
    [name, category, type, personalData, dataSource],
  );

  const toggle = <T,>(arr: T[], v: T, set: (n: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const publish = () =>
    start(() => {
      setError("");
      if (!name.trim() || !description.trim()) {
        setError("Skill 이름과 설명은 필수입니다.");
        return;
      }
      // No-code 입력 → 표준 Skill Manifest 변환 (§22)
      const skill = ops.buildCustomSkill({
        name,
        icon,
        description,
        category,
        type,
        inputs,
        outputs: outputs.filter(Boolean),
        dataSource,
        instruction,
        personalData,
      });
      update((s) => ops.addCustomSkill(s, skill));
      router.push(`/shop/${skill.id}`);
    });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">스킬 만들기</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          코드 없이 필요한 금융 능력을 직접 만듭니다. 입력한 내용은 표준 Skill Manifest 로 자동 변환됩니다.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card className="space-y-3.5 p-4">
            <Field label="Skill Name">
              <div className="flex gap-2">
                <input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value.slice(0, 2))}
                  className="w-14 rounded-xl border border-line bg-surface px-3 py-2.5 text-center text-[18px] outline-none focus:border-brand-400"
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 월 예산 분석"
                  className="flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-[13.5px] outline-none focus:border-brand-400"
                />
              </div>
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-brand-400"
              />
            </Field>

            <Field label="분야 Category">
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                  <Chip key={c} active={category.includes(c)} onClick={() => toggle(category, c, setCategory)}>
                    {CATEGORY_LABEL[c]}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label="기능 Type">
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TYPE_LABEL) as SkillType[]).map((t) => (
                  <Chip key={t} active={type.includes(t)} onClick={() => toggle(type, t, setType)}>
                    {TYPE_LABEL[t]}
                  </Chip>
                ))}
              </div>
            </Field>
          </Card>

          <Card className="space-y-3.5 p-4">
            <Field label="Input">
              <ul className="space-y-1.5">
                {inputs.map((inp, i) => (
                  <li key={i} className="flex gap-2">
                    <input
                      value={inp.label}
                      onChange={(e) =>
                        setInputs(inputs.map((x, j) => (i === j ? { ...x, label: e.target.value } : x)))
                      }
                      placeholder="입력 항목 이름"
                      className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] outline-none focus:border-brand-400"
                    />
                    <select
                      value={inp.kind}
                      onChange={(e) =>
                        setInputs(
                          inputs.map((x, j) =>
                            i === j ? { ...x, kind: e.target.value as SkillInput["kind"] } : x,
                          ),
                        )
                      }
                      className="rounded-xl border border-line bg-surface px-2 py-2 text-[12px] outline-none focus:border-brand-400"
                    >
                      <option value="money">금액</option>
                      <option value="number">숫자</option>
                      <option value="text">텍스트</option>
                      <option value="region">지역</option>
                    </select>
                    <button
                      onClick={() => setInputs(inputs.filter((_, j) => j !== i))}
                      className="px-2 text-[13px] text-ink-300 hover:text-risk-high"
                      aria-label="입력 삭제"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setInputs([...inputs, { label: "", kind: "money" }])}
                className="mt-1.5 text-[12px] font-semibold text-brand-700 hover:underline"
              >
                ＋ 입력 항목 추가
              </button>
            </Field>

            <Field label="Output">
              <ul className="space-y-1.5">
                {outputs.map((o, i) => (
                  <li key={i} className="flex gap-2">
                    <input
                      value={o}
                      onChange={(e) => setOutputs(outputs.map((x, j) => (i === j ? e.target.value : x)))}
                      placeholder="출력 항목 이름"
                      className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] outline-none focus:border-brand-400"
                    />
                    <button
                      onClick={() => setOutputs(outputs.filter((_, j) => j !== i))}
                      className="px-2 text-[13px] text-ink-300 hover:text-risk-high"
                      aria-label="출력 삭제"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setOutputs([...outputs, ""])}
                className="mt-1.5 text-[12px] font-semibold text-brand-700 hover:underline"
              >
                ＋ 출력 항목 추가
              </button>
            </Field>

            <Field label="Data Source">
              <input
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                placeholder="예: 사용자 입력값 / 통계청"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] outline-none focus:border-brand-400"
              />
            </Field>

            <Field label="Instruction">
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={2}
                placeholder="이 Skill 이 결과를 어떻게 해석해야 하는지 적어주세요."
                className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-brand-400"
              />
            </Field>

            <Field label="Permission">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-canvas px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={personalData}
                  onChange={(e) => setPersonalData(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--color-brand-600)]"
                />
                <span className="text-[12.5px] text-ink-700">개인 금융정보(수입·지출 등)를 입력받습니다</span>
              </label>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-400">
                개인정보를 다루면 위험도가 자동으로 MEDIUM 으로 설정됩니다. 외부 통신, 데이터 쓰기, 금융 실행은
                Custom Skill 에서 허용되지 않습니다. (§23)
              </p>
            </Field>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-[11px] font-bold tracking-wider text-ink-400">SKILL MANIFEST (자동 생성)</p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-ink-900 px-3 py-3 text-[11px] leading-relaxed text-brand-100">
              {manifest}
            </pre>
          </Card>

          <Card className="p-4">
            <p className="text-[13px] font-bold text-ink-900">Test</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">
              게시 전에 Manifest 유효성을 확인합니다.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2.5 w-full"
              onClick={() => setTested(true)}
              disabled={!name.trim() || !description.trim()}
            >
              Manifest 검증 실행
            </Button>
            {tested && (
              <ul className="snap-in mt-2.5 space-y-1 text-[11.5px]">
                <Check ok={Boolean(name.trim())} label="Skill 이름" />
                <Check ok={Boolean(description.trim())} label="설명" />
                <Check ok={inputs.some((i) => i.label.trim())} label="입력 항목 1개 이상" />
                <Check ok={outputs.some(Boolean)} label="출력 항목 1개 이상" />
                <Check ok label="금융실행 권한 없음 (필수)" />
                <Check ok label={`위험도 ${personalData ? "MEDIUM" : "LOW"} 자동 판정`} />
              </ul>
            )}
          </Card>

          {error && <p className="text-[12px] text-risk-high">{error}</p>}

          <Button size="lg" className="w-full" onClick={publish} disabled={pending || !name.trim()}>
            {pending ? "게시 중…" : "Publish · My Skills 에 추가"}
          </Button>
          <p className="text-center text-[11px] text-ink-400">
            게시한 Skill 은 미검증(Unverified) 상태로 내 계정에만 표시됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-bold text-ink-900">{label}</p>
      {children}
    </div>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1 text-[12px] font-medium transition ${
        active ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-surface text-ink-500 hover:border-brand-300"
      }`}
    >
      {children}
    </button>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={ok ? "text-risk-low" : "text-risk-high"}>
      {ok ? "✓" : "✕"} {label}
    </li>
  );
}
