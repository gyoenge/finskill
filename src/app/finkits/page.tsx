"use client";

import Link from "next/link";
import { useStore, Loading } from "@/components/StoreProvider";
import { FINKITS, PERSONA_MAP, RECIPES } from "@/lib/data/personas";
import { Card, SectionHeader } from "@/components/ui";
import { InstallKitButton } from "@/components/actions";
import { SkillChip } from "@/components/SkillCard";

/** 화면 05. FinKit (README §8, §27) + Skill Recipe (§15) */
export default function FinKitPage() {
  const { state, ready, catalog } = useStore();
  const installed = new Set(state.installed.map((i) => i.skillId));
  const myPersona = state.personaId;

  if (!ready) return <Loading />;

  const kits = [...FINKITS].sort((a, b) => (a.persona === myPersona ? -1 : b.persona === myPersona ? 1 : 0));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">FinKit</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Persona 별로 미리 구성된 Skill 묶음입니다. 하나씩 찾을 필요 없이 한 번에 설치하세요.
        </p>
      </header>

      <section className="space-y-4">
        {kits.map((kit) => {
          const persona = PERSONA_MAP[kit.persona];
          const missing = kit.skillIds.filter((id) => !installed.has(id));
          const mine = kit.persona === myPersona;
          return (
            <Card key={kit.id} className={`p-5 ${mine ? "border-brand-300 ring-1 ring-brand-100" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="puzzle-piece flex h-14 w-14 shrink-0 items-center justify-center bg-brand-50 text-[26px]">
                    {kit.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[16px] font-bold text-ink-900">{kit.name}</p>
                      {mine && (
                        <span className="rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          내 Persona
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] text-ink-500">
                      {persona.icon} {persona.summary}
                    </p>
                  </div>
                </div>
                {missing.length > 0 ? (
                  <InstallKitButton skillIds={missing} label={`부족한 ${missing.length}개 설치`} />
                ) : (
                  <span className="rounded-xl bg-brand-50 px-3 py-2 text-[12px] font-semibold text-brand-700">
                    ✓ 전부 보유 중
                  </span>
                )}
              </div>

              <p className="mt-3 rounded-xl bg-canvas px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-700">
                <span className="font-semibold">추천 이유 · </span>
                {kit.reason}
              </p>

              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {kit.skillIds.map((id) => {
                  const s = catalog.find((c) => c.id === id);
                  if (!s) return null;
                  return (
                    <li key={id}>
                      <SkillChip
                        skill={s}
                        right={
                          installed.has(id) ? (
                            <span className="shrink-0 text-[11px] font-semibold text-brand-600">보유</span>
                          ) : (
                            <Link href={`/shop/${id}`} className="shrink-0 text-[11px] text-ink-300 hover:text-brand-700">
                              보기
                            </Link>
                          )
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </section>

      <section>
        <SectionHeader
          title="Skill Recipe"
          desc="FinKit 이 '능력의 묶음'이라면, Recipe 는 '능력들이 협업하는 방법'입니다. (§15)"
        />
        <ul className="grid gap-3 md:grid-cols-2">
          {RECIPES.map((r) => {
            const missing = r.steps.map((s) => s.skillId).filter((id) => !installed.has(id));
            return (
              <Card as="li" key={r.id} className="flex flex-col p-4">
                <p className="text-[14px] font-bold text-ink-900">{r.name}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{r.description}</p>
                <ol className="mt-3 flex-1 space-y-1.5">
                  {r.steps.map((step, i) => {
                    const s = catalog.find((c) => c.id === step.skillId);
                    return (
                      <li key={step.skillId} className="flex items-center gap-2 text-[12px]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-canvas text-[10px] font-bold text-ink-400">
                          {i + 1}
                        </span>
                        <span className="shrink-0">{s?.icon ?? "🧩"}</span>
                        <span className="truncate font-medium text-ink-700">{step.note}</span>
                        {!installed.has(step.skillId) && (
                          <span className="ml-auto shrink-0 text-[10.5px] text-ink-300">미보유</span>
                        )}
                      </li>
                    );
                  })}
                </ol>
                <div className="mt-3 border-t border-line pt-3">
                  {missing.length > 0 ? (
                    <InstallKitButton skillIds={missing} label={`Recipe 실행에 필요한 ${missing.length}개 설치`} />
                  ) : (
                    <p className="text-[12px] font-semibold text-brand-700">
                      ✓ 이 Recipe 를 바로 실행할 수 있습니다
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
