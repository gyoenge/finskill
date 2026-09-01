import { NextResponse } from "next/server";
import { deleteAgent, installSkills, updateAgent } from "@/lib/store";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = (await req.json()) as {
    name?: string;
    persona?: string;
    instructions?: string;
    skillIds?: string[];
  };
  if (patch.skillIds) installSkills(patch.skillIds);
  return NextResponse.json({ state: updateAgent(id, patch) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json({ state: deleteAgent(id) });
}
