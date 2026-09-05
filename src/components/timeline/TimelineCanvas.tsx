"use client";
import { useEffect, useRef } from "react";
import { AssetIcon, eventAsset, Pio } from "@/components/Brand";
import { formatEventDate, parseEventDate, type LifeEvent, type FinEvent } from "@/lib/domain/timeline";
const BADGES = { confirmed: "✓ 확정", expected: "◇ 예상", goal: "☆ 목표" };
type Node = { kind: "event"; event: LifeEvent ;} | { kind: "now" ;};
export function TimelineCanvas({ lifeEvents, finEvents, onSelect, now = new Date() }: { lifeEvents: LifeEvent[]; finEvents: FinEvent[]; onSelect?: (event: LifeEvent) => void; now?: Date ;}) {
  const scroll = useRef<HTMLDivElement>(null); const marker = useRef<HTMLDivElement>(null);
  const nodes: Node[] = []; let inserted = false;
  for (const event of lifeEvents) { if (!inserted && (parseEventDate(event.date)?.getTime() ?? Infinity) > now.getTime()) { nodes.push({ kind: "now" }); inserted = true ;} nodes.push({ kind: "event", event }) ;} if (!inserted) nodes.push({ kind: "now" });
  useEffect(() => { const box = scroll.current, m = marker.current; if (box && m) box.scrollLeft = Math.max(0, m.offsetLeft - box.clientWidth / 2 + 60) ;}, []);
  return <div ref={scroll} className="timeline-scroll" tabIndex={0} role="region" aria-label="나의 이벤트 타임라인, 좌우로 스크롤할 수 있어요"><div className="timeline-track">
    {nodes.map((n) => n.kind === "now" ? <div ref={marker} key="now" className="timeline-now"><div className="now-label"><strong>지금, 여기</strong><span>{now.getFullYear()}.{String(now.getMonth() + 1).padStart(2, "0")}</span></div><Pio size={98} /><span className="now-dot" /><span className="now-caption">다음을 준비하는 중</span></div> : <button key={n.event.id} onClick={() => onSelect?.(n.event)} className="timeline-event" aria-label={`${n.event.title}, ${formatEventDate(n.event.date)}, 상세 보기`}><span className="event-date">{formatEventDate(n.event.date)}</span><span className="event-stem" /><span className="event-orb"><AssetIcon name={eventAsset(n.event)} size={44} /></span><strong>{n.event.title}</strong><span className={`status-badge ${n.event.certainty}`}>{BADGES[n.event.certainty]}</span><small>{finEvents.filter(f => f.lifeEventId === n.event.id && f.status === "pending").length > 0 ? `체크포인트 ${finEvents.filter(f => f.lifeEventId === n.event.id && f.status === "pending").length}개` : ""}</small></button>)}
  </div></div>;
}
