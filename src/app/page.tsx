"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTimeline, TimelineLoading } from "@/components/timeline/TimelineStore";
import { TimelineCanvas } from "@/components/timeline/TimelineCanvas";
import { RightNowPanel } from "@/components/timeline/RightNowPanel";
import { PioSays } from "@/components/Brand";
import { ageOf, sortedLifeEvents, statusLabel, upcomingLifeEvents } from "@/lib/domain/selectors";
import { parseEventDate, type LifeEvent } from "@/lib/domain/timeline";

/** 화면 3 — Home / 나의 20대 (설계 §14~§21) */
export default function HomePage() {
  const { state, ready } = useTimeline();
  const [selected, setSelected] = useState<LifeEvent | null>(null);

  const events = useMemo(() => sortedLifeEvents(state), [state]);
  const upcoming = useMemo(() => upcomingLifeEvents(state, 3), [state]);

  if (!ready) return <TimelineLoading />;

  const age = state.user ? ageOf(state.user.birthYear) : null;
  const status = state.user ? statusLabel(state.user.currentStatus) : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-fin-navy">안녕하세요! 👋</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {age ? `${age}세` : ""}
            {status ? ` · ${status}` : ""}
            {state.user?.region ? ` · ${state.user.region}` : ""}
          </p>
        </div>
        <Link
          href="/onboarding"
          className="rounded-xl bg-fin-green-500 px-3.5 py-2 text-[12.5px] font-bold text-white transition hover:bg-fin-green-600"
        >
          ＋ 새로운 Event 추가
        </Link>
      </header>

      {state.isDemo && (
        <PioSays>
          지금 보이는 건 예시 Timeline이에요. <Link href="/onboarding" className="font-bold text-fin-green-700 underline">내 20대 그리기</Link>로 나만의 Timeline을 만들어 보세요.
        </PioSays>
      )}

      {/* Timeline (약 70%) + Right Now (약 30%) */}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="card-soft p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-extrabold text-fin-navy">나의 20대</h2>
              <p className="text-[12px] text-ink-500">지금까지의 이야기와 앞으로의 계획을 한눈에.</p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="rounded-xl bg-canvas px-4 py-10 text-center text-[13px] text-ink-400">
              아직 Event가 없어요. 앞으로 계획한 일을 추가해 보세요.
            </div>
          ) : (
            <TimelineCanvas
              lifeEvents={events}
              finEvents={state.finEvents}
              onSelect={setSelected}
            />
          )}

          {/* 다가오는 Event */}
          {upcoming.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2 text-[12.5px] font-bold text-ink-700">다가오는 Event</p>
              <ul className="grid gap-2 sm:grid-cols-3">
                {upcoming.map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => setSelected(e)}
                      className="w-full rounded-xl bg-canvas px-3 py-2.5 text-left transition hover:bg-fin-green-50"
                    >
                      <p className="text-[13px] font-bold text-ink-900">{e.title}</p>
                      <p className="text-[11px] text-ink-400">
                        {parseEventDate(e.date)?.getFullYear()}.
                        {String((parseEventDate(e.date)?.getMonth() ?? 0) + 1).padStart(2, "0")}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <RightNowPanel state={state} onSelectFinEvent={() => { /* Phase 2: Event Drawer */ }} />
      </div>

      {/* 선택한 Event 요약 (Phase 2 에서 Right Drawer 로 대체) */}
      {selected && (
        <div className="card-soft p-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-extrabold text-fin-navy">{selected.title}</p>
            <button onClick={() => setSelected(null)} className="text-[12px] text-ink-400 hover:text-ink-700">
              닫기
            </button>
          </div>
          <p className="mt-1 text-[12px] text-ink-500">
            이 Event를 위한 체크포인트{" "}
            {state.finEvents.filter((f) => f.lifeEventId === selected.id).length}개가 준비돼 있어요.
            <span className="text-ink-400"> (상세 Drawer는 다음 단계에서 제공됩니다.)</span>
          </p>
        </div>
      )}
    </div>
  );
}
