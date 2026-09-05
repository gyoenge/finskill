"use client";

import { Icon } from "@/components/Icon";
import { LIFE_EVENT_CATALOG, formatEventDate, parseEventDate, type LifeEvent, type FinEvent } from "@/lib/domain/timeline";

/**
 * 나의 20대 Timeline — 부드러운 Path 위에 Life Event 노드를 배치한다 (설계 §16).
 * 현재 위치 ◎ 를 가장 강하게 강조하고, 각 노드 아래 Fin Event 개수를 점으로 표시한다.
 */

const CERTAINTY_BADGE: Record<string, { label: string; mark: string }> = {
  confirmed: { label: "확정", mark: "✓" },
  expected: { label: "예상", mark: "◇" },
  goal: { label: "목표", mark: "☆" },
};

function iconForType(type: string): string {
  return LIFE_EVENT_CATALOG[type as keyof typeof LIFE_EVENT_CATALOG]?.icon ?? "target";
}


type Node =
  | { kind: "event"; event: LifeEvent; finCount: number }
  | { kind: "now" };

export function TimelineCanvas({
  lifeEvents,
  finEvents,
  onSelect,
  now = new Date(),
}: {
  lifeEvents: LifeEvent[]; // 날짜 오름차순 정렬된 상태로 전달
  finEvents: FinEvent[];
  onSelect?: (event: LifeEvent) => void;
  now?: Date;
}) {
  // NOW 마커를 시간순 올바른 위치에 끼워넣는다.
  const nowTime = now.getTime();
  const nodes: Node[] = [];
  let inserted = false;
  for (const event of lifeEvents) {
    const t = parseEventDate(event.date)?.getTime() ?? Infinity;
    if (!inserted && t > nowTime) {
      nodes.push({ kind: "now" });
      inserted = true;
    }
    nodes.push({
      kind: "event",
      event,
      finCount: finEvents.filter((f) => f.lifeEventId === event.id && f.status === "pending").length,
    });
  }
  if (!inserted) nodes.push({ kind: "now" });

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-stretch gap-0 px-2">
        {nodes.map((node, i) => {
          const isLast = i === nodes.length - 1;
          if (node.kind === "now") {
            return (
              <div key="now" className="flex flex-col items-center" style={{ width: 96 }}>
                <div className="flex h-[68px] items-center">
                  <Connector left={i > 0} right={!isLast} strong />
                  <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-fin-green-500 ring-4 ring-fin-green-100">
                    <span className="h-2.5 w-2.5 rounded-full bg-white pulse-dot" />
                  </span>
                  <Connector left={false} right={!isLast} strong />
                </div>
                <p className="mt-2 text-[12px] font-bold text-fin-green-600">지금, 여기</p>
                <p className="text-[11px] text-ink-400">
                  {now.getFullYear()}.{String(now.getMonth() + 1).padStart(2, "0")}
                </p>
              </div>
            );
          }

          const { event, finCount } = node;
          const badge = CERTAINTY_BADGE[event.certainty];
          const past = event.status === "past";
          return (
            <button
              key={event.id}
              onClick={() => onSelect?.(event)}
              className="group flex flex-col items-center text-center focus:outline-none"
              style={{ width: 108 }}
            >
              <div className="flex h-[68px] items-center">
                <Connector left={i > 0} right={!isLast} />
                <span
                  className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl transition group-hover:-translate-y-0.5 ${
                    past
                      ? "bg-fin-green-50 text-fin-green-600"
                      : "bg-surface text-ink-500 ring-1 ring-line"
                  }`}
                >
                  <Icon name={iconForType(event.type) as never} size={20} />
                </span>
                <Connector left={false} right={!isLast} />
              </div>
              <p className="mt-2 line-clamp-1 text-[13px] font-bold text-ink-900">{event.title}</p>
              <p className="text-[11px] text-ink-400">{formatEventDate(event.date)}</p>
              <span
                className={`mt-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  event.certainty === "confirmed"
                    ? "bg-fin-green-50 text-fin-green-700"
                    : event.certainty === "expected"
                      ? "bg-accent-50 text-accent-700"
                      : "bg-fin-yellow-bg text-[#a9781a]"
                }`}
              >
                {badge.mark} {badge.label}
              </span>
              {finCount > 0 && (
                <span className="mt-1 flex items-center gap-0.5" title={`체크포인트 ${finCount}개`}>
                  {Array.from({ length: Math.min(finCount, 4) }).map((_, k) => (
                    <span key={k} className="h-1.5 w-1.5 rounded-full bg-fin-orange/70" />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Connector({ left, right, strong }: { left: boolean; right: boolean; strong?: boolean }) {
  return (
    <span
      aria-hidden
      className={`h-[2px] ${strong ? "bg-fin-green-200" : "bg-line"}`}
      style={{ width: 24, opacity: left || right ? 1 : 0 }}
    />
  );
}
