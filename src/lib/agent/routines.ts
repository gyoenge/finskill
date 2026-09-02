import type { Routine, RoutineFinding, RoutineRun } from "@/lib/types";
import { SCHOLARSHIPS_REAL } from "@/lib/data/seed/scholarships";
import { fetchLhNotices } from "@/lib/agent/api/lh";
import { fetchYouthPolicies, guessCategory } from "@/lib/agent/api/youth-policy";

/**
 * 루틴 실행 엔진 (AX 자동화).
 *
 * 접속 시 실행(체크인)과 서버 예약 실행(Cron)이 이 함수를 공유한다.
 * 실행 컨텍스트를 인자로 받으므로 저장 위치(localStorage / DB)와 무관하다.
 *
 * 핵심 원칙 — 같은 내용을 반복해서 알리지 않는다.
 * 이미 보고한 항목은 routine.seenIds 로 걸러내고, 새로 생긴 것만 findings 에 담는다.
 * 매일 아침 같은 목록을 다시 보내면 알림이 곧 소음이 되기 때문이다.
 */

const DAY = 86_400_000;

const today = () => new Date().toISOString().slice(0, 10);

/** YYYY-MM-DD 또는 YYYY.MM.DD → D-day (음수면 이미 지남) */
function ddayOf(dateStr: string): number | null {
  const m = dateStr.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!m) return null;
  const target = new Date(`${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}T00:00:00+09:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date(`${today()}T00:00:00+09:00`);
  return Math.round((target.getTime() - now.getTime()) / DAY);
}

/** 루틴이 지금 실행될 차례인지 */
export function isDue(r: Routine, now = new Date()): boolean {
  if (!r.enabled) return false;
  const day = now.toISOString().slice(0, 10);
  if (r.startsAt > day) return false;
  if (r.endsAt && r.endsAt < day) return false;
  if (!r.lastRunAt) return true;

  const elapsed = now.getTime() - new Date(r.lastRunAt).getTime();
  const period = r.every === "daily" ? DAY : r.every === "weekly" ? 7 * DAY : 30 * DAY;
  return elapsed >= period;
}

/** 기간이 끝나 더 이상 돌지 않는 루틴인지 */
export function isExpired(r: Routine, now = new Date()): boolean {
  return Boolean(r.endsAt && r.endsAt < now.toISOString().slice(0, 10));
}

/* ---------------- 루틴별 수집기 ---------------- */

/**
 * 지역 거주 요건 판정.
 *
 * 원본의 "지역거주여부" 는 서술형이다 — "해당없음" 이거나
 * "천안시에 1년 이상 주민등록" 처럼 문장으로 들어 있다.
 * 제한이 없거나 내 지역이 언급된 경우에만 자격이 있다고 본다.
 */
function regionEligible(criteria: string, myRegion?: string): boolean {
  const text = (criteria || "").trim();
  if (!text || /해당없음|제한없음|전국/.test(text)) return true;
  if (!myRegion) return true; // 지역을 모르면 걸러내지 않는다
  return text.includes(myRegion);
}

/** 마감 감시 — 장학금·LH 공고에서 마감이 임박한 것 */
async function collectDeadlines(r: Routine, ctx: RoutineContext): Promise<RoutineFinding[]> {
  const within = r.target.withinDays ?? 7;
  const kw = r.target.keyword?.trim();
  const out: RoutineFinding[] = [];

  for (const s of SCHOLARSHIPS_REAL) {
    const d = ddayOf(s.applyTo);
    if (d === null || d < 0 || d > within) continue;
    if (kw && !`${s.name} ${s.provider} ${s.majors} ${s.region}`.includes(kw)) continue;
    // 지역 장학금은 거주 요건이 있다. 내 지역이 아니면 자격이 없으므로 알릴 이유가 없다.
    if (!regionEligible(s.region, ctx.region)) continue;
    out.push({
      id: `sch:${s.id}`,
      title: `${s.name} (${s.provider})`,
      detail: `${s.amount || "지원금액 공고 참조"} · 마감 ${s.applyTo}`,
      dday: d,
      url: s.url,
      tone: d <= 3 ? "urgent" : "info",
    });
  }

  // 지역은 프로필에서, 키워드는 주제로 쓴다.
  // 키워드를 지역 파라미터로 넘기면 "이공계" 같은 주제어에 지역 필터가 걸리지 않아
  // 무관한 공고가 그대로 통과한다.
  const notices = await fetchLhNotices({ region: ctx.region || undefined, size: 60 });
  for (const n of notices ?? []) {
    const d = ddayOf(n.closesAt);
    if (d === null || d < 0 || d > within) continue;
    if (kw && !`${n.title} ${n.type} ${n.region}`.includes(kw)) continue;
    // 검색 화면은 결과가 없으면 전체를 보여주는 폴백이 낫지만,
    // 매일 오는 알림에서는 내 지역이 아닌 공고가 그대로 소음이 된다.
    if (!regionEligible(n.region, ctx.region)) continue;
    out.push({
      id: `lh:${n.id}`,
      title: n.title,
      detail: `${n.type} · ${n.region} · 마감 ${n.closesAt}`,
      dday: d,
      url: n.url,
      tone: d <= 3 ? "urgent" : "info",
    });
  }

  return out.sort((a, b) => (a.dday ?? 99) - (b.dday ?? 99));
}

/** 제도 변경 감시 — 청년정책에서 처음 보는 것 */
async function collectPolicyChanges(r: Routine, ctx: RoutineContext): Promise<RoutineFinding[]> {
  const kw = r.target.keyword?.trim();
  const category = kw ? guessCategory(kw) : undefined;
  const policies = await fetchYouthPolicies({ category, region: ctx.region || undefined, size: 60 });
  if (!policies) return [];

  return policies
    .filter((p) => !kw || `${p.name} ${p.agency} ${p.summary}`.includes(kw))
    .slice(0, 30)
    .map((p) => ({
      id: `pol:${p.id}`,
      title: p.name,
      detail: `${p.category}${p.subCategory ? "/" + p.subCategory : ""} · ${p.agency}${
        p.support ? ` · ${p.support.slice(0, 60)}` : ""
      }`,
      url: p.applyUrl,
      tone: "change" as const,
    }));
}

/**
 * 월간 점검 — 저장된 금융 프로필로 소비 상태를 정리한다.
 * 외부 조회가 아니라 계산이므로 매달 값이 달라질 때만 의미가 있다.
 */
function collectMonthlyReview(r: Routine, finance?: Record<string, number>): RoutineFinding[] {
  const income = Number(finance?.income ?? 0);
  if (!income) {
    return [
      {
        id: `mr:no-profile:${today().slice(0, 7)}`,
        title: "금융 프로필이 비어 있습니다",
        detail: "온보딩에서 월 수입·고정지출을 입력하면 매달 소비 상태를 정리해 드립니다.",
        tone: "info",
      },
    ];
  }
  const spend =
    Number(finance?.rent ?? 0) +
    Number(finance?.food ?? 0) +
    Number(finance?.transport ?? 0) +
    Number(finance?.etc ?? 0);
  const saving = income - spend;
  const rate = (saving / income) * 100;
  const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

  return [
    {
      // 월이 바뀌어야 새 항목으로 잡힌다
      id: `mr:${today().slice(0, 7)}`,
      title: `${new Date().getMonth() + 1}월 금융 점검`,
      detail: `수입 ${won(income)} · 지출 ${won(spend)} · 잔액 ${won(saving)} · 저축률 ${rate.toFixed(1)}%${
        rate < 20 ? " (권장 20% 미만)" : ""
      }`,
      tone: rate < 20 ? "urgent" : "info",
    },
  ];
}

/* ---------------- 실행 ---------------- */

export interface RoutineContext {
  /** 온보딩에서 받은 금융 프로필 */
  finance?: Record<string, number>;
  /** 온보딩에서 받은 거주 지역 — 키워드와 별개로 지역 필터에 쓴다 */
  region?: string;
}

export async function runRoutine(r: Routine, ctx: RoutineContext = {}): Promise<RoutineRun> {
  let all: RoutineFinding[] = [];

  switch (r.kind) {
    case "deadline":
      all = await collectDeadlines(r, ctx);
      break;
    case "policy-change":
      all = await collectPolicyChanges(r, ctx);
      break;
    case "monthly-review":
      all = collectMonthlyReview(r, ctx.finance);
      break;
    case "custom":
      // 사용자 정의는 마감·정책을 함께 본다. 키워드로 좁혀진다.
      all = [...(await collectDeadlines(r, ctx)), ...(await collectPolicyChanges(r, ctx))];
      break;
  }

  const seen = new Set(r.seenIds);
  const fresh = all.filter((f) => !seen.has(f.id));

  return {
    id: `run_${Date.now().toString(36)}`,
    routineId: r.id,
    routineName: r.name,
    ranAt: new Date().toISOString(),
    summary: summarize(r, fresh, all.length),
    findings: fresh.slice(0, 20),
    skipped: all.length - fresh.length,
  };
}

function summarize(r: Routine, fresh: RoutineFinding[], total: number): string {
  if (!total) return "확인했지만 해당하는 항목이 없습니다.";
  if (!fresh.length) return `${total}건을 확인했고 새로 생긴 것은 없습니다.`;

  const urgent = fresh.filter((f) => f.tone === "urgent").length;
  const head =
    r.kind === "deadline"
      ? `마감이 다가오는 ${fresh.length}건`
      : r.kind === "policy-change"
        ? `새로 확인된 정책 ${fresh.length}건`
        : `${fresh.length}건`;
  return urgent ? `${head} (급한 것 ${urgent}건)` : head;
}

/** 실행 후 루틴 상태 갱신 — 보고한 항목을 기억해 중복 알림을 막는다 */
export function markRan(r: Routine, run: RoutineRun): Routine {
  return {
    ...r,
    lastRunAt: run.ranAt,
    // 무한히 쌓이지 않도록 최근 것만 유지한다.
    seenIds: [...run.findings.map((f) => f.id), ...r.seenIds].slice(0, 300),
  };
}
