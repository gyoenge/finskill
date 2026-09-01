import { NextResponse } from "next/server";
import { allSkills, readState, resetState } from "@/lib/store";

export async function GET() {
  const state = readState();
  return NextResponse.json({ state, catalog: allSkills(state) });
}

/** 데모 초기화 — 온보딩부터 다시 시작할 때 사용한다. */
export async function DELETE() {
  return NextResponse.json({ state: resetState() });
}
