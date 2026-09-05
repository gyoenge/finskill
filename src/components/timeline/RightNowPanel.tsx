"use client";

import Link from "next/link";
import { daysUntil, type FinEvent } from "@/lib/domain/timeline";
import type { TimelineState } from "@/lib/domain/state";
import { nearestDeadline, rightNowFinEvents } from "@/lib/domain/selectors";

/**
 * Right Now Panel (설계 §18~§20).
 * 지금 중요한 것만: 우선 행동 1~3개 · 곧 다가오는 마감 · 놓치면 아까운 기회 1개.
 */
export function RightNowPanel({
  state,
  onSelectFinEvent,
  now = new Date(),
}: {
  state: TimelineState;
  onSelectFinEvent?: (f: FinEvent) => void;
  now?: Date;
}) {
  const priorities = rightNowFinEvents(state, 3, now);
  const deadline = nearestDeadline(state, now);

  return (
    <aside className="space-y-4">
      {/* 지금, 이것만 챙기세요 */}
      <section className="rounded-[1.25rem] bg-fin-cream p-4">
        <h2 className="text-[14px] font-extrabold text-fin-navy">지금, 이것만 챙기세요</h2>
        <p className="mt-0.5 text-[11.5px] text-ink-500">가장 중요한 금융 행동만 골랐어요.</p>
        <ul className="mt-3 space-y-2">
          {priorities.length === 0 && (
            <li className="rounded-xl bg-surface px-3 py-4 text-[12px] text-ink-400">
              지금 당장 챙길 것은 없어요. 새 Event를 추가하면 체크포인트를 만들어 드릴게요.
            </li>
          )}
          {priorities.map((f) => {
            const d = daysUntil(f.dueDate, now);
            return (
              <li key={f.id}>
                <button
                  onClick={() => onSelectFinEvent?.(f)}
                  className="card-soft card-soft-hover w-full p-3 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-bold text-ink-900">{f.title}</p>
                    {d !== null && d >= 0 && (
                      <span className="shrink-0 rounded-md bg-fin-orange-bg px-1.5 py-0.5 text-[10.5px] font-bold text-fin-orange">
                        D-{d}
                      </span>
                    )}
                  </div>
                  {f.note && <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-ink-500">{f.note}</p>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 곧 다가와요 */}
      {deadline && (
        <section className="card-soft p-4">
          <p className="text-[11.5px] font-bold text-ink-400">곧 다가와요</p>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <p className="text-[14px] font-extrabold text-ink-900">{deadline.title}</p>
            <span className="rounded-md bg-fin-orange px-2 py-0.5 text-[11px] font-extrabold text-white">
              D-{daysUntil(deadline.dueDate, now)}
            </span>
          </div>
          <p className="mt-0.5 text-[11.5px] text-ink-500">{deadline.dueDate?.replaceAll("-", ".")}</p>
        </section>
      )}

      {/* 놓치면 아까워요 — Opportunity (Phase 2 실데이터 연동 예정) */}
      <section className="card-soft overflow-hidden">
        <div className="bg-fin-yellow-bg px-4 py-3">
          <p className="text-[11.5px] font-bold text-[#a9781a]">놓치면 아까워요</p>
        </div>
        <div className="p-4">
          <p className="text-[13.5px] font-bold text-ink-900">내 Timeline 맞춤 기회</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">
            독립·취업 목표와 관련된 청년지원을 찾고 있어요.
          </p>
          <Link
            href="/opportunities"
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-fin-green-700 hover:underline"
          >
            지금의 기회 보기 →
          </Link>
        </div>
      </section>
    </aside>
  );
}
