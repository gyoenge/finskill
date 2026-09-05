import { NextResponse } from "next/server";
import { collectOpportunities } from "@/lib/agent/opportunity-source";

/**
 * GET /api/opportunities?region=서울
 *
 * 청년정책·LH·장학금을 Opportunity 로 정규화해 돌려준다 (설계 §53).
 * 서버는 무상태다 — 개인화 랭킹은 클라이언트가 Timeline Context 로 수행한다.
 */
export async function GET(req: Request) {
  const region = new URL(req.url).searchParams.get("region") ?? undefined;
  const bundle = await collectOpportunities(region || undefined);
  return NextResponse.json(bundle, {
    headers: { "Cache-Control": "no-store" },
  });
}
