"use client";

import Link from "next/link";
import { useTimeline } from "@/components/timeline/TimelineStore";
import { ageOf, statusLabel } from "@/lib/domain/selectors";

export function PersonalContextBar({ compact = false }: { compact?: boolean }) {
  const { state, ready } = useTimeline();
  if (!ready || !state.user) return null;

  const profile = [
    `${ageOf(state.user.birthYear)}세`,
    statusLabel(state.user.currentStatus),
    state.user.region,
  ].filter(Boolean).join(" · ");

  return <aside className={`personal-context ${compact ? "compact" : ""}`} aria-label="맞춤 정보 기준">
    <span className="personal-context-icon" aria-hidden="true">✓</span>
    <div><strong>내 정보 적용 중</strong><p>{profile} · 타임라인 {state.lifeEvents.length}개 기준</p></div>
    <Link href="/me">내 정보 보기</Link>
  </aside>;
}
