"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Pio } from "@/components/Brand";
import { useTimeline } from "@/components/timeline/TimelineStore";
import { setFinEventStatus } from "@/lib/domain/state";
import { computeReadiness } from "@/lib/domain/readiness";
import {
  LIFE_EVENT_CATALOG,
  daysUntil,
  formatEventDate,
  type FinEvent,
  type LifeEvent,
} from "@/lib/domain/timeline";

/**
 * 화면 4 — Event Detail (설계 §22~§26).
 * Timeline 노드 클릭 시 Right Drawer(모바일 Bottom Sheet)로 연다.
 * Readiness · 체크리스트 · Insight · 맞춤 기회 · AI 연결.
 */

const CERTAINTY_LABEL: Record<string, string> = { confirmed: "확정", expected: "예상", goal: "목표" };

export function EventDrawer({ event, onClose }: { event: LifeEvent; onClose: () => void }) {
  const { state, update } = useTimeline();

  // ESC 로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const finEvents = state.finEvents
    .filter((f) => f.lifeEventId === event.id)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const readiness = computeReadiness(event, finEvents, state.financialContext);
  const icon = LIFE_EVENT_CATALOG[event.type]?.icon ?? "target";
  const d = daysUntil(event.date);

  const toggle = (f: FinEvent) =>
    update((s) => setFinEventStatus(s, f.id, f.status === "completed" ? "pending" : "completed"));

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button className="drawer-overlay absolute inset-0 bg-fin-navy/30" aria-label="닫기" onClick={onClose} />
      <div className="drawer-panel absolute inset-x-0 bottom-0 flex max-h-[86vh] flex-col rounded-t-3xl bg-surface shadow-xl md:inset-y-0 md:left-auto md:right-0 md:bottom-auto md:h-full md:max-h-none md:w-[400px] md:rounded-none">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fin-green-50 text-fin-green-600">
              <Icon name={icon as never} size={24} />
            </span>
            <div>
              <p className="text-[17px] font-extrabold text-fin-navy">{event.title}</p>
              <p className="text-[12px] text-ink-500">
                {formatEventDate(event.date)} · {CERTAINTY_LABEL[event.certainty]}
                {d !== null && d > 0 && <span className="text-fin-orange"> · D-{d}</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-canvas hover:text-ink-700" aria-label="닫기">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* Readiness */}
          <section>
            <div className="flex items-baseline justify-between">
              <h3 className="text-[13px] font-bold text-fin-navy">{event.title} 준비도</h3>
              <span className="text-[22px] font-extrabold text-fin-green-600">{readiness.overallScore}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-canvas">
              <div className="dna-bar h-full rounded-full bg-fin-green-500" style={{ width: `${readiness.overallScore}%` }} />
            </div>
            <ul className="mt-3 space-y-2">
              {readiness.dimensions.map((dim) => (
                <li key={dim.key} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-[12px] text-ink-500">{dim.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="dna-bar h-full rounded-full"
                      style={{
                        width: `${dim.score}%`,
                        background: dim.score >= 70 ? "var(--color-fin-green-500)" : dim.score >= 45 ? "var(--color-fin-yellow)" : "var(--color-fin-orange)",
                      }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-[11.5px] font-semibold text-ink-400">{dim.score}%</span>
                </li>
              ))}
            </ul>
            {readiness.nextAction && (
              <p className="mt-3 rounded-xl bg-fin-orange-bg px-3 py-2.5 text-[12.5px] font-medium text-[#9a4d13]">
                {readiness.nextAction}
              </p>
            )}
          </section>

          {/* Checklist */}
          <section>
            <h3 className="mb-2 text-[13px] font-bold text-fin-navy">체크리스트</h3>
            {finEvents.length === 0 ? (
              <p className="rounded-xl bg-canvas px-3 py-4 text-[12px] text-ink-400">
                이 Event에는 자동 생성된 체크포인트가 없어요.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {finEvents.map((f) => {
                  const doneState = f.status === "completed";
                  return (
                    <li key={f.id}>
                      <button
                        onClick={() => toggle(f)}
                        className="flex w-full items-start gap-2.5 rounded-xl border border-line px-3 py-2.5 text-left transition hover:border-fin-green-200"
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            doneState ? "border-fin-green-500 bg-fin-green-500 text-white" : "border-ink-300 text-transparent"
                          }`}
                        >
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12l5 5L20 6" />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <p className={`text-[13px] font-semibold ${doneState ? "text-ink-400 line-through" : "text-ink-900"}`}>
                            {f.title}
                          </p>
                          {f.note && <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-400">{f.note}</p>}
                        </div>
                        {f.dueDate && (
                          <span className="ml-auto shrink-0 text-[10.5px] font-medium text-ink-400">
                            {formatEventDate(f.dueDate)}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Insight */}
          <section className="rounded-2xl bg-fin-yellow-bg p-4">
            <div className="flex items-start gap-2.5">
              <Pio size={30} />
              <div>
                <p className="text-[12px] font-bold text-[#a9781a]">20FIN Insight</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-fin-navy">{insightFor(event, d, readiness.overallScore)}</p>
              </div>
            </div>
          </section>

          {/* 맞춤 기회 (Phase 2C 실데이터) */}
          <section className="card-soft p-4">
            <p className="text-[12px] font-bold text-ink-400">맞춤 기회</p>
            <p className="mt-1 text-[12.5px] text-ink-600">
              이 Event와 관련된 청년지원을 <Link href="/opportunities" className="font-bold text-fin-green-700 hover:underline">지금의 기회</Link>에서 확인하세요.
            </p>
          </section>
        </div>

        {/* CTA — Event → AI 연결 (설계 §26) */}
        <div className="border-t border-line px-5 py-3">
          <Link
            href={`/ask?event=${event.id}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-fin-green-500 py-3 text-[14px] font-bold text-white transition hover:bg-fin-green-600"
          >
            🐥 피오에게 {event.title} 계획 물어보기
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Event 종류·남은 기간·준비도로 한 줄 Insight 생성 (규칙 기반) */
function insightFor(event: LifeEvent, d: number | null, score: number): string {
  const months = d !== null && d > 0 ? Math.max(1, Math.round(d / 30)) : null;
  if (event.status === "past") return `이미 지난 Event예요. 이어지는 금융 흐름을 다음 Event에서 챙겨볼게요.`;
  if (months === null) return `날짜를 정하면 언제 무엇을 준비해야 할지 더 정확히 안내해 드릴게요.`;
  if (score < 50) return `${event.title}까지 약 ${months}개월 남았어요. 준비도가 아직 낮으니 가장 부족한 항목부터 챙겨보는 게 좋아요.`;
  if (score < 75) return `${event.title}까지 약 ${months}개월 남았어요. 지금 속도면 무난하지만, 부족한 항목을 채우면 더 안정적이에요.`;
  return `${event.title} 준비가 잘 되고 있어요. 남은 ${months}개월 동안 계획을 유지하세요.`;
}
