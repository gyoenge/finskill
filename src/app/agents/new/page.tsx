"use client";

import Link from "next/link";
import { useStore, Loading } from "@/components/StoreProvider";
import { FINKITS, PERSONAS, RECIPES } from "@/lib/data/personas";
import { AgentBuilder } from "@/components/AgentBuilder";

/** 화면 06. Agent Builder */
export default function NewAgentPage() {
  const { state, ready, catalog } = useStore();
  if (!ready) return <Loading />;
  return (
    <div className="space-y-5">
      <Link href="/agents" className="inline-block text-[12px] font-semibold text-ink-400 hover:text-brand-700">
        ← 나의 에이전트
      </Link>
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">새로운 에이전트 만들기</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          에이전트 기본 정보를 설정해 주세요. Persona + Instructions + Skill Set + LLM 으로 구성됩니다.
        </p>
      </header>
      <AgentBuilder
        catalog={catalog}
        personas={PERSONAS}
        kits={FINKITS}
        recipes={RECIPES}
        suggestedPersonaId={state.personaId}
      />
    </div>
  );
}
