"use client";

import { useStore, Loading } from "@/components/StoreProvider";
import { ShopClient } from "@/components/ShopClient";
import { LinkButton } from "@/components/ui";

/** 화면 02. Skill Shop */
export default function ShopPage() {
  const { state, ready, catalog } = useStore();
  if (!ready) return <Loading />;
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">Skill Shop</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            필요한 금융 능력을 발견하고 Agent 에 장착하세요. 모든 Skill 은 출처·권한·위험도를 공개합니다.
          </p>
        </div>
        <LinkButton href="/skill-builder" variant="secondary" size="sm">
          🛠️ 직접 만들기
        </LinkButton>
      </header>
      <ShopClient catalog={catalog} installedIds={state.installed.map((i) => i.skillId)} />
    </div>
  );
}
