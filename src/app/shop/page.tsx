"use client";

import { useStore } from "@/components/StoreProvider";
import { ShopClient } from "@/components/ShopClient";
import { LinkButton } from "@/components/ui";

/** 화면 02. Skill Shop */
export default function ShopPage() {
  // 카탈로그는 사용자 상태와 무관한 정적 데이터라 SSR 에서 바로 그린다.
  // (ready 를 기다리면 크롤러·심사위원에게 빈 화면만 보인다)
  const { state, catalog } = useStore();
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">스킬샵</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            스킬 = 에이전트에 장착하는 금융 능력 하나입니다. 모든 스킬은 출처·권한·위험도를 공개합니다.
          </p>
        </div>
        <LinkButton href="/skill-builder" variant="secondary" size="sm">
          ＋ 직접 만들기
        </LinkButton>
      </header>
      <ShopClient catalog={catalog} installedIds={state.installed.map((i) => i.skillId)} />
    </div>
  );
}
