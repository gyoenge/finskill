import { NextResponse } from "next/server";
import { installSkills, toggleSkill, uninstallSkill, updateState } from "@/lib/store";

type Body =
  | { action: "install"; skillIds: string[]; agentId?: string }
  | { action: "uninstall"; skillId: string }
  | { action: "toggle"; skillId: string; enabled: boolean };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (body.action === "install") {
    let state = installSkills(body.skillIds);
    // Skill Gap 흐름(§14): 설치와 동시에 요청한 Agent 에 장착한다.
    if (body.agentId) {
      state = updateState((s) => ({
        ...s,
        agents: s.agents.map((a) =>
          a.id === body.agentId
            ? { ...a, skillIds: Array.from(new Set([...a.skillIds, ...body.skillIds])) }
            : a,
        ),
      }));
    }
    return NextResponse.json({ state });
  }

  if (body.action === "uninstall") return NextResponse.json({ state: uninstallSkill(body.skillId) });
  if (body.action === "toggle") return NextResponse.json({ state: toggleSkill(body.skillId, body.enabled) });

  return NextResponse.json({ error: "알 수 없는 action" }, { status: 400 });
}
