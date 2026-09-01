import { NextResponse } from "next/server";
import { createAgent, installSkills } from "@/lib/store";
import { MODEL } from "@/lib/llm";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name: string;
    persona: string;
    instructions: string;
    skillIds: string[];
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Agent 이름을 입력해주세요." }, { status: 400 });
  }

  // Agent 에 장착하려면 먼저 설치되어 있어야 한다 (§10 → §11)
  installSkills(body.skillIds ?? []);

  const { agent } = createAgent({
    name: body.name.trim(),
    persona: body.persona?.trim() || "개인 금융 도우미",
    instructions: body.instructions?.trim() || "사용자의 금융 문제를 쉽게 설명하고 해결을 돕는다.",
    model: MODEL,
    skillIds: body.skillIds ?? [],
  });

  return NextResponse.json({ agent });
}
