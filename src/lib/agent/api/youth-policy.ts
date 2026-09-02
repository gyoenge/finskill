/**
 * 온통청년 청년정책 API (한국고용정보원).
 *
 *   GET https://www.youthcenter.go.kr/go/ythip/getPlcy
 *
 * 주의 — data.go.kr 의 해당 데이터셋은 API 유형이 LINK 라서 data.go.kr 서비스키로는
 * 호출되지 않는다. 온통청년에서 따로 발급받는 인증키(apiKeyNm)를 써야 한다.
 * 구 엔드포인트(/opi/youthPlcyList.do)는 302 로 폐기되었다.
 */

const ENDPOINT = "https://www.youthcenter.go.kr/go/ythip/getPlcy";
const TIMEOUT_MS = 6000;

/** 정책 대분류 — API 의 lclsfNm 값 */
export const POLICY_CATEGORIES = ["일자리", "주거", "교육", "복지문화", "참여권리"] as const;
export type PolicyCategory = (typeof POLICY_CATEGORIES)[number];

export interface YouthPolicy {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  summary: string;
  support: string;
  agency: string;
  applyMethod: string;
  applyUrl: string;
  period: string;
  minAge: number | null;
  maxAge: number | null;
}

interface RawPolicy {
  plcyNo?: string;
  plcyNm?: string;
  lclsfNm?: string;
  mclsfNm?: string;
  plcyExplnCn?: string;
  plcySprtCn?: string;
  sprvsnInstCdNm?: string;
  operInstCdNm?: string;
  plcyAplyMthdCn?: string;
  aplyUrlAddr?: string;
  bizPrdEtcCn?: string;
  sprtTrgtMinAge?: number | string;
  sprtTrgtMaxAge?: number | string;
  sprtTrgtAgeLmtYn?: string;
}

export function youthKeyAvailable() {
  return Boolean(process.env.YOUTH_CENTER_API_KEY);
}

/** 질문에서 정책 대분류를 고른다 */
export function guessCategory(query: string): PolicyCategory | undefined {
  if (/월세|전세|주거|집|자취|보증금|임대|기숙사/.test(query)) return "주거";
  if (/취업|일자리|구직|인턴|창업|알바/.test(query)) return "일자리";
  if (/학자금|등록금|교육|학습|자격증|어학/.test(query)) return "교육";
  if (/문화|복지|건강|심리|의료/.test(query)) return "복지문화";
  return undefined;
}

const clean = (s?: string) =>
  (s ?? "").replace(/[❍○]/g, " ").replace(/\s+/g, " ").trim();

const toAge = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * 정책 목록을 가져온다.
 * 키가 없거나 실패하면 null 을 돌려주고 호출부가 그 사실을 사용자에게 알린다.
 */
export async function fetchYouthPolicies(opts: {
  category?: PolicyCategory;
  region?: string;
  size?: number;
}): Promise<YouthPolicy[] | null> {
  const key = process.env.YOUTH_CENTER_API_KEY;
  if (!key) return null;

  // 한글 파라미터는 반드시 인코딩해야 한다. 안 하면 400 Bad Request 가 난다.
  const params = new URLSearchParams({
    apiKeyNm: key,
    rtnType: "json",
    pageNum: "1",
    pageSize: String(opts.size ?? 60),
  });
  if (opts.category) params.set("lclsfNm", opts.category);

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ENDPOINT}?${params}`, { signal: ac.signal, cache: "no-store" });
    if (!res.ok) return null;

    const body = (await res.json()) as {
      resultCode?: number;
      result?: { youthPolicyList?: RawPolicy[] };
    };
    if (body.resultCode !== 200 || !body.result?.youthPolicyList) return null;

    let items = body.result.youthPolicyList.map(toPolicy);

    // API 가 지역 필터를 직접 받지 않으므로 기관명·정책명으로 거른다.
    if (opts.region) {
      const hit = items.filter(
        (p) => p.agency.includes(opts.region!) || p.name.includes(opts.region!),
      );
      if (hit.length) items = hit;
    }
    return items;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toPolicy(r: RawPolicy): YouthPolicy {
  return {
    id: r.plcyNo ?? "",
    name: clean(r.plcyNm) || "(정책명 없음)",
    category: r.lclsfNm ?? "",
    subCategory: r.mclsfNm ?? "",
    summary: clean(r.plcyExplnCn).slice(0, 120),
    support: clean(r.plcySprtCn).slice(0, 200),
    agency: r.operInstCdNm ?? r.sprvsnInstCdNm ?? "",
    applyMethod: clean(r.plcyAplyMthdCn).slice(0, 150),
    applyUrl: r.aplyUrlAddr ?? "https://www.youthcenter.go.kr/",
    period: clean(r.bizPrdEtcCn),
    minAge: r.sprtTrgtAgeLmtYn === "Y" ? toAge(r.sprtTrgtMinAge) : null,
    maxAge: r.sprtTrgtAgeLmtYn === "Y" ? toAge(r.sprtTrgtMaxAge) : null,
  };
}

export function policyFacts(items: YouthPolicy[]): string {
  if (!items.length) return "조건에 맞는 청년정책을 찾지 못했습니다.";
  return items
    .map(
      (p) =>
        `- ${p.name} (${p.agency}) | 분류 ${p.category}/${p.subCategory}` +
        (p.minAge && p.maxAge ? ` | 대상 만 ${p.minAge}~${p.maxAge}세` : "") +
        (p.period ? ` | 기간 ${p.period}` : "") +
        (p.support ? `\n    지원내용: ${p.support}` : ""),
    )
    .join("\n");
}
