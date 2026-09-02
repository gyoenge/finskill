import { NextResponse } from "next/server";
import type { Routine } from "@/lib/types";
import { runRoutine } from "@/lib/agent/routines";

/**
 * 루틴 실행 엔드포인트 (무상태).
 *
 * 공공 API 키가 서버에만 있으므로 실행은 서버에서 해야 한다.
 * 클라이언트가 루틴 정의를 보내면 결과만 돌려주고, 저장은 클라이언트가 한다.
 * 예약 실행(Cron)도 같은 runRoutine() 을 쓴다.
 */
export async function POST(req: Request) {
  const { routine, finance, region } = (await req.json()) as {
    routine: Routine;
    finance?: Record<string, number>;
    region?: string;
  };

  if (!routine?.id || !routine.kind) {
    return NextResponse.json({ error: "루틴 정보가 없습니다." }, { status: 400 });
  }

  try {
    const run = await runRoutine(routine, { finance, region });
    return NextResponse.json({ run });
  } catch (err) {
    console.error("[finskill] 루틴 실행 실패", err);
    return NextResponse.json({ error: "루틴 실행에 실패했습니다." }, { status: 500 });
  }
}
