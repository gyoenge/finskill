"use client";

import { useTimeline, TimelineLoading } from "@/components/timeline/TimelineStore";
import { ageOf, statusLabel } from "@/lib/domain/selectors";

/** 내 정보 (설계 §6). Phase 2 에서 프로필 편집·Progressive Profiling 연결 */
export default function MePage() {
  const { state, ready, reset } = useTimeline();
  if (!ready) return <TimelineLoading />;
  const u = state.user;

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-[22px] font-extrabold tracking-tight text-fin-navy">내 정보</h1>
      <div className="card-soft space-y-2 p-5 text-[13px]">
        <Row label="나이" value={u ? `${ageOf(u.birthYear)}세` : "-"} />
        <Row label="현재 상태" value={u ? statusLabel(u.currentStatus) : "-"} />
        <Row label="거주" value={u?.livingType ?? "-"} />
        <Row label="지역" value={u?.region ?? "-"} />
        <Row label="Life Event" value={`${state.lifeEvents.length}개`} />
        <Row label="Fin Event" value={`${state.finEvents.length}개`} />
      </div>
      <button
        onClick={() => {
          if (confirm("데모 상태로 초기화할까요?")) reset();
        }}
        className="text-[12px] font-semibold text-ink-400 hover:text-fin-orange"
      >
        데모 상태로 초기화
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-1.5 last:border-0">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}
