import {
  PROGRAM_MAP,
  PROGRAM_RELATIONS,
  YOUTH_PROGRAMS,
  type YouthProgram,
  type ProgramTier,
} from "@/lib/data/youth-asset-programs";

/**
 * 청년 자산형성 제도 매칭·조합 최적화 (README §34).
 *
 * 이 파일은 전부 결정론적 코드다. LLM 은 여기서 나온 결과를 설명만 한다.
 * 자격 판정과 중복 규칙은 틀리면 사용자가 수백만원을 손해 보는 영역이라
 * 어떤 추론도 모델에 맡기지 않는다.
 */

export interface AssetProfile {
  age: number;
  /** 개인 연소득, 원 */
  personalIncome: number;
  /** 가구 기준중위소득 대비 %, 모르면 undefined */
  householdMedianPct?: number;
  /** 근로·사업소득 유무 */
  hasEarnedIncome: boolean;
  /** 이미 가입한 제도 id */
  enrolled: string[];
  /** 월 저축 여력, 원 */
  monthlyCapacity: number;
}

export interface Verdict {
  programId: string;
  name: string;
  status: YouthProgram["status"];
  eligible: boolean;
  /** 충족한 우대 구간 (해당 시) */
  tier?: ProgramTier;
  /** 판정 근거 — 통과/탈락 이유를 모두 남긴다 */
  reasons: string[];
  blockers: string[];
  note?: string;
  sources: string[];
  verifiedAt: string;
}

export interface Allocation {
  programId: string;
  name: string;
  tierLabel: string;
  /** 이 제도에 넣을 월 납입액 */
  monthly: number;
  /** 월 정부기여금 */
  monthlyBenefit: number;
  termMonths: number;
  /** 만기까지 받는 정부기여금 총액 */
  totalBenefit: number;
}

export interface AssetPlan {
  verdicts: Verdict[];
  /** 동시 가입이 막힌 조합 */
  conflicts: { a: string; b: string; reason: string; exception?: string }[];
  /** 여력 안에서 정부기여금을 최대화하는 배분 */
  allocations: Allocation[];
  totalMonthly: number;
  totalBenefit: number;
  /** 여력이 남았는지 */
  leftover: number;
  unresearched: string[];
}

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

/** 나이·소득·가구소득으로 가입 자격을 판정한다 */
function judge(p: YouthProgram, profile: AssetProfile): Verdict {
  const reasons: string[] = [];
  const blockers: string[] = [];

  if (p.status === "closed") {
    blockers.push(`${p.name}은(는) 신규가입이 종료되었습니다.`);
  }

  if (profile.age < p.age.min || profile.age > p.age.max) {
    blockers.push(`나이 요건 만 ${p.age.min}~${p.age.max}세를 벗어납니다 (현재 만 ${profile.age}세).`);
  } else if (p.age.max < 200) {
    reasons.push(`나이 요건 만 ${p.age.min}~${p.age.max}세 충족`);
  }

  if (p.requiresEarnedIncome && !profile.hasEarnedIncome) {
    blockers.push("근로·사업소득이 있어야 가입할 수 있습니다.");
  } else if (p.requiresEarnedIncome) {
    reasons.push("근로·사업소득 요건 충족");
  }

  // 우대 구간부터 순서대로 검사해 가장 유리한 구간을 찾는다.
  let matched: ProgramTier | undefined;
  for (const t of p.tiers) {
    const incomeOk = t.personalIncomeMax === null || profile.personalIncome <= t.personalIncomeMax;
    const householdOk =
      t.householdMedianMax === null ||
      profile.householdMedianPct === undefined ||
      profile.householdMedianPct <= t.householdMedianMax;
    if (incomeOk && householdOk) {
      matched = t;
      break;
    }
  }

  if (!matched) {
    const widest = p.tiers[p.tiers.length - 1];
    if (widest.personalIncomeMax !== null && profile.personalIncome > widest.personalIncomeMax) {
      blockers.push(`개인소득 상한 ${won(widest.personalIncomeMax)}을 초과합니다.`);
    }
    if (
      widest.householdMedianMax !== null &&
      profile.householdMedianPct !== undefined &&
      profile.householdMedianPct > widest.householdMedianMax
    ) {
      blockers.push(`가구 기준중위소득 ${widest.householdMedianMax}% 상한을 초과합니다.`);
    }
  } else {
    reasons.push(`${matched.label} 구간 해당`);
    if (profile.householdMedianPct === undefined && matched.householdMedianMax !== null) {
      reasons.push(
        `⚠️ 가구 기준중위소득을 모르는 상태로 판정했습니다. ${matched.householdMedianMax}% 이하여야 최종 확정됩니다.`,
      );
    }
  }

  return {
    programId: p.id,
    name: p.name,
    status: p.status,
    eligible: blockers.length === 0 && Boolean(matched),
    tier: matched,
    reasons,
    blockers,
    note: p.note,
    sources: p.sources,
    verifiedAt: p.verifiedAt,
  };
}

/** 이미 가입한 제도와 충돌하는지 확인한다 */
function conflictsWith(programId: string, enrolled: string[]) {
  return PROGRAM_RELATIONS.filter(
    (r) =>
      !r.compatible &&
      ((r.a === programId && enrolled.includes(r.b)) || (r.b === programId && enrolled.includes(r.a))),
  );
}

/** 월 납입액 대비 정부기여금 효율 — 여력 배분 우선순위 */
function efficiency(p: YouthProgram, tier: ProgramTier): number {
  if (p.matchFixedMonthly) return p.matchFixedMonthly / p.monthlyMax;
  return tier.matchRate / 100;
}

export function buildAssetPlan(profile: AssetProfile): AssetPlan {
  const verdicts = YOUTH_PROGRAMS.map((p) => judge(p, profile));

  // 기가입 제도와의 충돌을 판정에 반영한다.
  const conflicts: AssetPlan["conflicts"] = [];
  for (const v of verdicts) {
    for (const r of conflictsWith(v.programId, profile.enrolled)) {
      const other = r.a === v.programId ? r.b : r.a;
      v.eligible = false;
      v.blockers.push(`이미 가입한 ${PROGRAM_MAP[other]?.name ?? other}와(과) 중복가입이 불가합니다.`);
      conflicts.push({
        a: v.name,
        b: PROGRAM_MAP[other]?.name ?? other,
        reason: r.reason,
        exception: r.exception,
      });
    }
  }

  // 정부기여금이 있는 제도만 최적화 대상으로 삼는다.
  const candidates = verdicts
    .filter((v) => v.eligible && v.tier)
    .map((v) => ({ v, p: PROGRAM_MAP[v.programId] }))
    .filter(({ p }) => !p.taxBenefitOnly && p.status === "active")
    .sort((x, y) => efficiency(y.p, y.v.tier!) - efficiency(x.p, x.v.tier!));

  const allocations: Allocation[] = [];
  const chosen: string[] = [];
  let remaining = profile.monthlyCapacity;

  for (const { v, p } of candidates) {
    if (remaining <= 0) break;

    // 이미 고른 제도와 충돌하면 건너뛴다 (효율 높은 쪽이 먼저 자리를 잡는다).
    const clash = PROGRAM_RELATIONS.some(
      (r) =>
        !r.compatible &&
        ((r.a === p.id && chosen.includes(r.b)) || (r.b === p.id && chosen.includes(r.a))),
    );
    if (clash) continue;

    const monthly = Math.min(p.monthlyMax, remaining);
    // 정액 매칭은 기준 납입액을 다 채워야 받는다.
    if (p.matchFixedMonthly && monthly < p.monthlyMax) continue;

    const monthlyBenefit = p.matchFixedMonthly ?? Math.round(monthly * (v.tier!.matchRate / 100));

    allocations.push({
      programId: p.id,
      name: p.name,
      tierLabel: v.tier!.label,
      monthly,
      monthlyBenefit,
      termMonths: p.termMonths,
      totalBenefit: monthlyBenefit * p.termMonths,
    });
    chosen.push(p.id);
    remaining -= monthly;
  }

  return {
    verdicts,
    conflicts,
    allocations,
    totalMonthly: allocations.reduce((a, b) => a + b.monthly, 0),
    totalBenefit: allocations.reduce((a, b) => a + b.totalBenefit, 0),
    leftover: Math.max(remaining, 0),
    unresearched: [],
  };
}

/** LLM 에게 넘길 사실 근거 */
export function planFacts(plan: AssetPlan, profile: AssetProfile): string {
  const lines: string[] = [];

  lines.push(
    `입력: 만 ${profile.age}세, 개인 연소득 ${won(profile.personalIncome)}, ` +
      `가구 중위소득 ${profile.householdMedianPct !== undefined ? profile.householdMedianPct + "%" : "미입력"}, ` +
      `근로소득 ${profile.hasEarnedIncome ? "있음" : "없음"}, 월 저축여력 ${won(profile.monthlyCapacity)}`,
  );

  lines.push("\n[가입 자격 판정]");
  for (const v of plan.verdicts) {
    const mark = v.eligible ? "가입 가능" : "가입 불가";
    lines.push(
      `- ${v.name} (${v.status === "closed" ? "신규가입 종료" : v.status === "proposed" ? "개정안" : "운영중"}): ${mark}` +
        (v.tier ? ` · ${v.tier.label}` : "") +
        (v.reasons.length ? `\n    근거: ${v.reasons.join(" / ")}` : "") +
        (v.blockers.length ? `\n    제외 사유: ${v.blockers.join(" / ")}` : "") +
        (v.note ? `\n    주의: ${v.note}` : ""),
    );
  }

  if (plan.conflicts.length) {
    lines.push("\n[중복가입 제한]");
    for (const c of plan.conflicts) {
      lines.push(`- ${c.a} ↔ ${c.b}: ${c.reason}${c.exception ? ` (예외: ${c.exception})` : ""}`);
    }
  }

  lines.push("\n[중복 가능 조합]");
  for (const r of PROGRAM_RELATIONS.filter((x) => x.compatible)) {
    lines.push(
      `- ${PROGRAM_MAP[r.a]?.name ?? r.a} + ${PROGRAM_MAP[r.b]?.name ?? r.b}: 동시 가입 가능 — ${r.reason}` +
        (r.exception ? ` ${r.exception}` : ""),
    );
  }

  if (plan.allocations.length) {
    lines.push("\n[월 저축여력 최적 배분 — 정부기여금 최대화]");
    for (const a of plan.allocations) {
      lines.push(
        `- ${a.name}(${a.tierLabel}): 월 ${won(a.monthly)} 납입 → 월 기여금 ${won(a.monthlyBenefit)} · ` +
          `${a.termMonths}개월 총 ${won(a.totalBenefit)}`,
      );
    }
    lines.push(
      `합계: 월 납입 ${won(plan.totalMonthly)} / 만기까지 받는 정부기여금 ${won(plan.totalBenefit)}` +
        (plan.leftover > 0 ? ` (남는 여력 ${won(plan.leftover)})` : ""),
    );
  } else {
    lines.push("\n[배분] 현재 조건으로 정부기여금을 받을 수 있는 제도가 없습니다.");
  }

  lines.push(
    "\n주의: 위 조건은 2026.09.02 조사 기준 초안이며 제도는 수시로 바뀝니다. " +
      "반드시 최신 공고로 확인해야 한다고 안내하세요. 여기 없는 수치를 지어내지 마세요.",
  );

  return lines.join("\n");
}
