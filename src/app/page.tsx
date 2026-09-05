"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTimeline, TimelineLoading } from "@/components/timeline/TimelineStore";
import { TimelineCanvas } from "@/components/timeline/TimelineCanvas";
import { RightNowPanel } from "@/components/timeline/RightNowPanel";
import { EventDrawer } from "@/components/timeline/EventDrawer";
import { ASSET_ROOT, AssetIcon, eventAsset } from "@/components/Brand";
import { ageOf, sortedLifeEvents, statusLabel, upcomingLifeEvents } from "@/lib/domain/selectors";
import { formatEventDate, type LifeEvent } from "@/lib/domain/timeline";
export default function HomePage() {
  const { state, ready } = useTimeline(); const [selected, setSelected] = useState<LifeEvent | null>(null); const [futureOnly, setFutureOnly] = useState(false);
  const events = useMemo(() => sortedLifeEvents(state), [state]); const upcoming = useMemo(() => upcomingLifeEvents(state, 3), [state]);
  if (!ready) return <TimelineLoading />;
  return <div className="home-page"><header className="page-header home-header"><div><p className="eyebrow">MY 20s, BETTER FINANCE</p><h1>안녕하세요! <span className="greeting-sun" aria-hidden="true">☀</span></h1><p>지금의 작은 준비가, 더 멋진 20대를 만들어요.</p></div><Link className="profile-pill" href="/me"><span className="profile-monogram">나</span><span>{state.user ? `${ageOf(state.user.birthYear)}세 · ${statusLabel(state.user.currentStatus)}` : "내 정보"}<small>{state.user?.region ?? "나의 이야기"}</small></span><span aria-hidden="true">↗</span></Link></header>
    {state.isDemo && <div className="demo-notice"><span className="status-badge expected">예시 타임라인</span><span>나의 계획을 입력하고 맞춤 체크포인트를 받아보세요.</span><Link href="/onboarding">내 20대 그리기 →</Link></div>}
    <div className="home-grid"><div className="home-main"><section className="timeline-hero"><Image src={`${ASSET_ROOT}/landscape-timeline-desktop.png`} fill sizes="(max-width: 767px) 100vw, (max-width: 1279px) 80vw, 65vw" preload alt="" className="timeline-landscape" /><div className="timeline-toolbar"><div><h2>나의 20대</h2><p>지금까지의 이야기, 앞으로의 계획을 한눈에.</p></div><div className="timeline-actions"><button className="button button-glass" aria-pressed={futureOnly} onClick={() => setFutureOnly(v => !v)}>{futureOnly ? "전체 보기" : "앞으로의 계획"}<span aria-hidden="true">⌄</span></button><Link href={state.isDemo ? "/onboarding" : "/onboarding?mode=add"} className="button button-primary">＋ 새로운 이벤트</Link></div></div>
      <TimelineCanvas lifeEvents={futureOnly ? events.filter(e => e.status !== "past") : events} finEvents={state.finEvents} onSelect={setSelected} /><div className="timeline-footnote">삶의 순서대로 이어지는 나의 이야기 <span>← 좌우로 살펴보세요 →</span></div></section>
      <section className="card-soft upcoming-section"><div className="section-heading"><h2>다가오는 이벤트</h2><span>다음 한 걸음을 준비해요</span></div>{upcoming.length > 0 ? <div className="upcoming-grid">{upcoming.map(e => { const checks = state.finEvents.filter(f => f.lifeEventId === e.id); const done = checks.filter(f => f.status === "completed").length; const ratio = checks.length ? Math.round(done / checks.length * 100) : null; return <button key={e.id} className="upcoming-card" onClick={() => setSelected(e)}><div className="upcoming-top"><span className={`asset-tile ${e.type}`}><AssetIcon name={eventAsset(e)} size={52} /></span><div><span className={`status-badge ${e.certainty}`}>{e.certainty === "goal" ? "☆ 목표" : e.certainty === "expected" ? "◇ 예상" : "✓ 확정"}</span><h3>{e.title}</h3><p>{formatEventDate(e.date)}</p></div><span className="chevron">›</span></div><div className="completion-label"><span>체크포인트 완료</span><b>{ratio === null ? "계획 전" : `${done}/${checks.length}`}</b></div><div className="progress-track" role="progressbar" aria-label={`${e.title} 체크포인트 완료율`} aria-valuenow={ratio ?? 0} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${ratio ?? 0}%` }} /></div></button> ;})}</div> : <div className="empty-inline">아직 예정된 이벤트가 없어요. 새로운 계획을 추가해보세요.</div>}</section>
      <div className="journey-banner"><Image src={`${ASSET_ROOT}/landscape-city-banner.png`} fill sizes="(max-width: 767px) 100vw, 60vw" alt="" /><p>지금의 준비가<br /><strong>더 자유로운 내일을 만들 거예요.</strong></p><span>My 20s,<br />Better Finance.</span></div></div>
      <RightNowPanel state={state} onSelectFinEvent={f => { const e = events.find(e => e.id === f.lifeEventId); if (e) setSelected(e) ;}} /></div>
    {selected && <EventDrawer event={selected} onClose={() => setSelected(null)} />}</div>;
}
