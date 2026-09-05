"use client";

import { PioSays } from "@/components/Brand";

/** 화면 5 — 지금의 기회 (설계 §27~§29). Phase 2 에서 실데이터(청년정책·LH·장학금) 연동 */
export default function OpportunitiesPage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-fin-navy">지금의 기회</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          20FIN이 내 Timeline과 상황을 기준으로 필요한 금융정보를 찾았어요.
        </p>
      </header>
      <PioSays>
        청년정책·주거지원·장학금을 내 Timeline에 맞춰 필터링하는 화면이에요. 다음 단계에서 실데이터 연동으로 채워집니다.
      </PioSays>
      <div className="card-soft p-6 text-[13px] text-ink-400">준비 중입니다.</div>
    </div>
  );
}
