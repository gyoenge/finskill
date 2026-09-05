"use client";

import { useEffect, useMemo, useState } from "react";
import { useTimeline } from "@/components/timeline/TimelineStore";
import { ageOf } from "./selectors";
import { rankOpportunities, type RankedOpportunity, type UserCtx } from "./opportunity-rank";
import type { Opportunity } from "./timeline";

export interface OpportunityBundle {
  opportunities: Opportunity[];
  total: number;
  sources: { key: string; label: string; count: number; live: boolean }[];
}

/**
 * /api/opportunities 를 불러와 Timeline Context 로 개인화 랭킹한다.
 * 지금의 기회 페이지와 홈 Right Now("놓치면 아까워요")가 공유한다.
 * 결과는 모듈 캐시에 담아 화면 전환 시 재요청을 줄인다.
 */
let cache: { region?: string; bundle: OpportunityBundle } | null = null;

export function useOpportunities() {
  const { state, ready } = useTimeline();
  const region = state.user?.region;
  const [bundle, setBundle] = useState<OpportunityBundle | null>(cache && cache.region === region ? cache.bundle : null);
  const [loading, setLoading] = useState(!bundle);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (cache && cache.region === region) {
      setBundle(cache.bundle);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(false);
    const q = region ? `?region=${encodeURIComponent(region)}` : "";
    fetch(`/api/opportunities${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((b: OpportunityBundle) => {
        cache = { region, bundle: b };
        if (alive) setBundle(b);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [ready, region]);

  const ranked = useMemo<RankedOpportunity[]>(() => {
    if (!bundle) return [];
    const ctx: UserCtx = {
      age: state.user ? ageOf(state.user.birthYear) : null,
      region,
      lifeSubtypes: state.lifeEvents.map((e) => e.subtype),
      futureTypes: [...new Set(state.lifeEvents.filter((e) => e.status !== "past").map((e) => e.type))],
    };
    return rankOpportunities(bundle.opportunities, ctx);
  }, [bundle, state.user, state.lifeEvents, region]);

  return { ranked, bundle, loading, error };
}
