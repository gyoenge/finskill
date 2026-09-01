import Link from "next/link";
import { allSkills, readState } from "@/lib/store";
import { FINKITS, PERSONAS, RECIPES } from "@/lib/data/personas";
import { AgentBuilder } from "@/components/AgentBuilder";

/** 화면 06. Agent Builder */
export const dynamic = "force-dynamic";

export default function NewAgentPage() {
  const state = readState();
  return (
    <div className="space-y-5">
      <Link href="/agents" className="inline-block text-[12px] font-semibold text-ink-400 hover:text-brand-700">
        ← My Agent
      </Link>
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">Agent Builder</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Agent = Persona + Instructions + Skill Set + LLM. 퍼즐을 맞추듯 능력을 장착하세요.
        </p>
      </header>
      <AgentBuilder
        catalog={allSkills(state)}
        personas={PERSONAS}
        kits={FINKITS}
        recipes={RECIPES}
        suggestedPersonaId={state.personaId}
      />
    </div>
  );
}
