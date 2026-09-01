import { NextResponse } from "next/server";
import type { OnboardingProfile } from "@/lib/types";
import { matchPersona, recommendKit } from "@/lib/recommend";
import { updateState } from "@/lib/store";
import { PERSONA_MAP } from "@/lib/data/personas";

export async function POST(req: Request) {
  const profile = (await req.json()) as OnboardingProfile;
  if (!profile?.status || !profile?.region) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const { personaId, reason } = matchPersona(profile);
  const kit = recommendKit(personaId);
  updateState((s) => ({ ...s, profile, personaId }));

  return NextResponse.json({
    personaId,
    persona: PERSONA_MAP[personaId],
    reason,
    kit,
  });
}
