"use client";

import { useEffect, useMemo, useState } from "react";
import { AssetIcon, PioSays } from "@/components/Brand";
import { TimelineLoading } from "@/components/timeline/TimelineStore";
import { useOpportunities } from "@/lib/domain/useOpportunities";
import type { RankedOpportunity } from "@/lib/domain/opportunity-rank";

const CATEGORY: Record<string, { label: string; description: string; asset: string }> = {
  housing: { label: "주거", description: "독립·이사·보증금에 도움 되는 정보", asset: "event-housing" },
  employment: { label: "일자리", description: "취업·인턴·구직 기간에 필요한 정보", asset: "event-career" },
  education: { label: "교육·장학", description: "학업·자격증·등록금에 관련된 정보", asset: "event-education" },
  asset: { label: "자산형성", description: "저축과 목돈 마련을 돕는 정보", asset: "event-savings" },
  finance: { label: "금융·복지", description: "생활비와 금융 부담을 덜어주는 정보", asset: "utility-opportunity" },
};

export default function OpportunitiesPage() {
  const { ranked, bundle, loading, error } = useOpportunities();
  const groups = useMemo(() => {
    const byCategory = new Map<string, RankedOpportunity[]>();
    for (const item of ranked) {
      const list = byCategory.get(item.opp.category) ?? [];
      list.push(item);
      byCategory.set(item.opp.category, list);
    }
    return [...byCategory.entries()].sort((a, b) => (b[1][0]?.score ?? 0) - (a[1][0]?.score ?? 0));
  }, [ranked]);
  const [active, setActive] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (groups.length && !groups.some(([key]) => key === active)) setActive(groups[0][0]);
  }, [groups, active]);

  const selected = groups.find(([key]) => key === active);
  const visible = selected ? (expanded ? selected[1] : selected[1].slice(0, 6)) : [];
  const activeMeta = CATEGORY[active] ?? CATEGORY.finance;

  return <div className="space-y-6">
    <header className="page-header opportunity-header"><div><p className="eyebrow">OPPORTUNITIES FOR YOU</p><h1>지금의 기회</h1><p>나의 계획에 가까운 지원정보를 주제별로 모았어요.</p></div><AssetIcon name="utility-opportunity" size={100} /></header>
    {bundle && !loading && <div className="opportunity-summary"><span>금융정보 <strong>{bundle.total}개</strong> 확인</span><span aria-hidden="true">→</span><span>나이 · 지역 · 계획 · 마감 기준</span><strong>관련 정보 {ranked.length}개</strong></div>}
    {loading && <TimelineLoading />}
    {error && <PioSays>정보를 불러오지 못했어요. 잠시 후 다시 방문해 주세요.</PioSays>}
    {!loading && !error && ranked.length === 0 && <PioSays>지금 보여드릴 기회를 찾지 못했어요. 새로운 계획이 있다면 타임라인에 추가해보세요.</PioSays>}
    {!loading && !error && groups.length > 0 && <>
      <nav className="opportunity-groups" aria-label="기회 주제">
        {groups.map(([key, items]) => { const meta = CATEGORY[key] ?? CATEGORY.finance; return <button key={key} type="button" aria-pressed={active === key} onClick={() => { setActive(key); setExpanded(false); }}><AssetIcon name={meta.asset} size={34} /><span><strong>{meta.label}</strong><small>{items.length}개</small></span></button>; })}
      </nav>
      {selected && <section className="opportunity-section" aria-live="polite">
        <div className="section-heading opportunity-section-heading"><div><h2>{activeMeta.label}</h2><p>{activeMeta.description}</p></div><span>{selected[1].length}개</span></div>
        <ul className="grid gap-5 xl:grid-cols-2">{visible.map(item => <OpportunityCard key={item.opp.id} r={item} />)}</ul>
        {selected[1].length > 6 && <button className="button opportunity-more" type="button" onClick={() => setExpanded(v => !v)}>{expanded ? "간단히 보기" : `${selected[1].length - 6}개 더 보기`}</button>}
      </section>}
    </>}
    {bundle && <p className="opportunity-source">출처: {bundle.sources.map(s => `${s.label} ${s.count}건`).join(" · ")}<br />관련성에 따른 안내이며, 신청 가능 여부는 공식 공고에서 확인해주세요.</p>}
  </div>;
}

function OpportunityCard({ r }: { r: RankedOpportunity }) {
  const { opp, reasons, dday } = r;
  const meta = CATEGORY[opp.category] ?? CATEGORY.finance;
  const amount = (opp.eligibility as { amount?: string }).amount;
  return <li className="card-soft opportunity-card"><div className="flex items-start gap-4"><span className="asset-tile"><AssetIcon name={meta.asset} size={52} /></span><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap gap-2"><span className="status-badge confirmed">{meta.label}</span>{dday !== null && <span className="status-badge deadline">D-{dday}</span>}</div><h2>{opp.title}</h2><p className="provider">{opp.provider}</p></div></div>{amount && amount.length < 40 && <span className="status-badge goal">{amount}</span>}{reasons.length > 0 && <div className="reasons"><p>내 계획과 어떤 관련이 있나요?</p><ul>{reasons.map((why, i) => <li key={i}><span className="text-fin-green-700">✓ </span>{why}</li>)}</ul></div>}{opp.officialUrl ? <a href={opp.officialUrl} target="_blank" rel="noopener noreferrer" className="button button-secondary">공식 정보 확인하기 ↗</a> : <p className="text-sm text-ink-500">신청 경로는 제공 기관에 확인해주세요.</p>}</li>;
}
