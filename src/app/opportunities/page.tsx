"use client";

import { Icon } from "@/components/Icon";
import { PioSays } from "@/components/Brand";
import { TimelineLoading } from "@/components/timeline/TimelineStore";
import { useOpportunities } from "@/lib/domain/useOpportunities";
import type { RankedOpportunity } from "@/lib/domain/opportunity-rank";

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  housing: { label: "주거", icon: "home" },
  employment: { label: "일자리", icon: "briefcase" },
  education: { label: "교육·장학", icon: "graduation" },
  asset: { label: "자산형성", icon: "trending" },
  finance: { label: "금융·복지", icon: "bank" },
};

/** 화면 5 — 지금의 기회 (설계 §27~§29·§53~§54) */
export default function OpportunitiesPage() {
  const { ranked, bundle, loading, error } = useOpportunities();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-fin-navy">지금의 기회</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          20FIN이 내 Timeline과 상황을 기준으로 필요한 금융정보를 찾았어요.
        </p>
      </header>

      {/* Filtering Funnel (설계 §28) */}
      {bundle && !loading && (
        <div className="card-soft flex flex-wrap items-center gap-x-2 gap-y-1 p-4 text-[12.5px]">
          <span className="font-bold text-ink-700">새로운 금융정보 {bundle.total}개 확인</span>
          <FunnelStep>나이·상태</FunnelStep>
          <FunnelStep>지역</FunnelStep>
          <FunnelStep>Life Event</FunnelStep>
          <FunnelStep>신청기간</FunnelStep>
          <span className="text-ink-300">→</span>
          <span className="rounded-lg bg-fin-green-50 px-2 py-1 font-bold text-fin-green-700">
            지금 확인할 정보 {ranked.length}개
          </span>
        </div>
      )}

      {loading && <TimelineLoading />}

      {error && (
        <PioSays>정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</PioSays>
      )}

      {!loading && !error && ranked.length === 0 && (
        <PioSays>지금 조건에 딱 맞는 기회를 찾지 못했어요. Timeline에 계획을 추가하면 더 잘 찾아드릴게요.</PioSays>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {ranked.slice(0, 24).map((r) => (
          <OpportunityCard key={r.opp.id} r={r} />
        ))}
      </ul>

      {bundle && (
        <p className="pt-2 text-center text-[11px] text-ink-400">
          출처: {bundle.sources.map((s) => `${s.label}(${s.count})`).join(" · ")}
          {bundle.sources.some((s) => s.live) && " · 실시간 조회"}
        </p>
      )}
    </div>
  );
}

function FunnelStep({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-ink-400">
      <span className="text-ink-300">↓</span>
      {children}
    </span>
  );
}

function OpportunityCard({ r }: { r: RankedOpportunity }) {
  const { opp, reasons, dday } = r;
  const meta = CATEGORY_META[opp.category] ?? { label: opp.category, icon: "bank" };
  const amount = (opp.eligibility as { amount?: string })?.amount;

  return (
    <li className="card-soft card-soft-hover flex flex-col p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fin-green-50 text-fin-green-600">
          <Icon name={meta.icon as never} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[14px] font-bold text-ink-900">{opp.title}</p>
          <p className="mt-0.5 text-[11.5px] text-ink-400">{opp.provider}</p>
        </div>
        {dday !== null && (
          <span className="shrink-0 rounded-md bg-fin-orange-bg px-1.5 py-0.5 text-[10.5px] font-bold text-fin-orange">
            D-{dday}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-500">{meta.label}</span>
        {amount && amount.length < 20 && (
          <span className="rounded-md bg-fin-yellow-bg px-1.5 py-0.5 text-[10.5px] font-semibold text-[#a9781a]">{amount}</span>
        )}
      </div>

      {reasons.length > 0 && (
        <div className="mt-3 rounded-xl bg-canvas p-2.5">
          <p className="text-[10.5px] font-bold text-ink-400">왜 추천했나요?</p>
          <ul className="mt-1 space-y-0.5">
            {reasons.map((why, i) => (
              <li key={i} className="flex items-center gap-1.5 text-[11.5px] text-ink-600">
                <span className="text-fin-green-500">✓</span>
                {why}
              </li>
            ))}
          </ul>
        </div>
      )}

      {opp.officialUrl && (
        <a
          href={opp.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center justify-center rounded-xl border border-line py-2 text-[12.5px] font-bold text-fin-green-700 transition hover:bg-fin-green-50"
        >
          자세히 보기 →
        </a>
      )}
    </li>
  );
}
