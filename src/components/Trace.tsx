"use client";

import { useState } from "react";
import type { TraceStep } from "@/lib/types";
import { ResultCards } from "@/components/ResultCards";

const EXECUTOR_LABEL: Record<string, string> = {
  http: "API",
  rag: "RAG",
  calculator: "Calculator",
};

/**
 * Skill Trace (README §19)
 * 내부 Chain-of-Thought 가 아니라 실행된 Skill · Tool · 데이터 출처만 보여준다.
 */
export function SkillTrace({ trace, sources }: { trace: TraceStep[]; sources?: string[] }) {
  const [open, setOpen] = useState(false);
  if (!trace.length) return null;

  return (
    <div className="mt-2.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-500 transition hover:border-brand-300 hover:text-brand-700"
      >
        <span>🔍 어떻게 찾았나요?</span>
        <span className="text-ink-300">·</span>
        <span>Used {trace.length} Skills</span>
        <span className={`transition ${open ? "rotate-180" : ""}`}>⌃</span>
      </button>

      {open && (
        <div className="fade-up mt-2 rounded-2xl border border-line bg-canvas p-3">
          <ol className="space-y-2.5">
            {trace.map((t, i) => (
              <li key={`${t.skillId}-${i}`}>
                <div className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center self-stretch">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface text-[14px]">{t.icon}</span>
                    {i < trace.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[12.5px] font-bold text-ink-900">{t.skillName}</span>
                      <span className="rounded bg-surface px-1.5 py-px text-[10px] font-semibold text-ink-400">
                        {EXECUTOR_LABEL[t.executor] ?? t.executor}
                      </span>
                      <span className="text-[10px] text-ink-300">{t.ms}ms</span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-ink-500">↳ {t.summary}</p>
                    <ResultCards data={t.data} />
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {sources && sources.length > 0 && (
            <div className="mt-3 border-t border-line pt-2.5">
              <p className="text-[10px] font-bold tracking-wider text-ink-400">SOURCE</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-500">{sources.join(" · ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
