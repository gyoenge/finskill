"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Routine, RoutineRun } from "@/lib/types";
import { isDue } from "@/lib/agent/routines";
import { useStore } from "@/components/StoreProvider";
import * as ops from "@/lib/state-ops";
import { Card } from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * 체크인 루틴 실행기 (홈 상단).
 *
 * 서버 예약 실행이 붙기 전까지, 접속 시점에 실행할 차례가 된 루틴을 돌린다.
 * "예약 실행" 이라고 부르지 않는다 — 브라우저가 닫혀 있으면 돌지 않기 때문이다.
 * Cron 이 연결되면 같은 runRoutine() 을 서버가 부르고, 여기는 결과 표시만 맡는다.
 */
export function RoutineRunner() {
  const { state, ready, update, getState } = useStore();
  const [running, setRunning] = useState<string | null>(null);
  const started = useRef(false);

  const due = state.routines.filter((r) => isDue(r));

  const runOne = useCallback(
    async (routine: Routine) => {
      setRunning(routine.id);
      try {
        const res = await fetch("/api/routines/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            routine,
            finance: getState().profile?.finance ?? {},
            region: getState().profile?.region,
          }),
        });
        if (!res.ok) return;
        const { run } = (await res.json()) as { run: RoutineRun };
        update((s) => ops.recordRoutineRun(s, run));
      } catch {
        // 네트워크 오류 — 다음 접속 때 다시 시도한다.
      } finally {
        setRunning(null);
      }
    },
    [update, getState],
  );

  // 접속 시 한 번만, 실행할 차례가 된 루틴을 순서대로 돌린다.
  useEffect(() => {
    if (!ready || started.current) return;
    const pending = getState().routines.filter((r) => isDue(r));
    if (!pending.length) return;
    started.current = true;
    (async () => {
      for (const r of pending) await runOne(r);
    })();
  }, [ready, runOne, getState]);

  const recent = state.routineRuns.filter((r) => r.findings.length > 0).slice(0, 3);
  if (!ready) return null;
  if (!state.routines.length) return null;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon name="bot" size={15} />
          </span>
          <p className="text-[13px] font-bold text-ink-900">
            {running ? "루틴 확인 중…" : due.length ? `확인할 루틴 ${due.length}건` : "오늘 확인할 것"}
          </p>
        </div>
        <Link href="/routines" className="text-[11.5px] font-semibold text-brand-700 hover:underline">
          루틴 관리
        </Link>
      </div>

      {running && (
        <div className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2.5">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="pulse-dot h-1.5 w-1.5 rounded-full bg-brand-500"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
          <span className="text-[12px] text-ink-500">공고와 정책을 확인하고 있습니다…</span>
        </div>
      )}

      {!running && recent.length === 0 && (
        <p className="rounded-xl bg-canvas px-3 py-3 text-[12px] leading-relaxed text-ink-500">
          새로 알려드릴 내용이 없습니다. 마감이 다가오거나 새 정책이 생기면 여기에 표시됩니다.
        </p>
      )}

      {!running &&
        recent.map((run) => (
          <div key={run.id} className="mb-2.5 last:mb-0">
            <p className="mb-1.5 text-[11.5px] font-semibold text-ink-400">
              {run.routineName} · {run.summary}
            </p>
            <ul className="space-y-1.5">
              {run.findings.slice(0, 4).map((f) => (
                <li
                  key={f.id}
                  className={`flex items-start gap-2 rounded-xl px-3 py-2 ${
                    f.tone === "urgent" ? "bg-risk-high-bg" : "bg-canvas"
                  }`}
                >
                  {f.dday !== undefined && (
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${
                        f.tone === "urgent" ? "bg-white/70 text-risk-high" : "bg-white text-ink-500"
                      }`}
                    >
                      D-{f.dday}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-ink-900">{f.title}</span>
                    <span className="block truncate text-[11px] text-ink-500">{f.detail}</span>
                  </span>
                  {f.url && (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-[11px] font-semibold text-brand-700 hover:underline"
                    >
                      공고
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </Card>
  );
}
