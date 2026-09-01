import type { HousingListing } from "@/lib/data/seed";

/**
 * LH 분양임대공고문 조회 서비스 (공공데이터포털 15058530).
 *
 *   GET https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1
 *
 * 주의 — 이 API 는 공고 "목록" 만 준다.
 * 보증금·월세·면적·자격요건은 응답에 없고 공고문(PDF) 안에 있다.
 * 그래서 이 Skill 의 Passport 는 금액 비교를 할 수 없다고 명시한다.
 */

const ENDPOINT = "https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1";
/** 공공 API 가 느리거나 죽어도 데모가 멈추면 안 된다 */
const TIMEOUT_MS = 6000;

/**
 * 이 API 는 LH 의 모든 공고를 준다 — 토지·상가 공급까지 섞여 있다.
 * (실측: 60건 중 토지 23 · 상가 1)
 * 청년 주거 서비스에 무의미하므로 주거 관련 상위유형만 남긴다.
 */
const RESIDENTIAL = ["임대주택", "주거복지", "분양주택", "공공분양"];

function isResidential(category: string) {
  return RESIDENTIAL.some((c) => category.includes(c));
}

/** 상시모집 공고는 마감일이 9999.01.01 로 온다 */
export function isAlwaysOpen(closesAt: string) {
  return closesAt.startsWith("9999");
}

export interface LhNotice {
  id: string;
  title: string;
  /** 매입임대 / 전세임대 / 행복주택 등 */
  type: string;
  /** 주거복지 / 분양 등 상위 구분 */
  category: string;
  region: string;
  postedAt: string;
  closesAt: string;
  status: string;
  url: string;
}

interface RawNotice {
  PAN_ID?: string;
  PAN_NM?: string;
  AIS_TP_CD_NM?: string;
  UPP_AIS_TP_NM?: string;
  CNP_CD_NM?: string;
  PAN_NT_ST_DT?: string;
  CLSG_DT?: string;
  PAN_SS?: string;
  DTL_URL?: string;
  ALL_CNT?: string;
}

function yyyymmdd(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export function lhKeyAvailable() {
  return Boolean(process.env.DATA_GO_KR_SERVICE_KEY);
}

/**
 * 공고 목록을 가져온다.
 * 키가 없거나 호출이 실패하면 null 을 돌려주고, 호출부가 시드로 폴백한다.
 */
export async function fetchLhNotices(opts: { region?: string; size?: number }): Promise<LhNotice[] | null> {
  const key = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!key) return null;

  // 게시일은 최근 90일, 마감일은 앞으로 180일까지 — 진행 중인 공고를 넓게 잡는다.
  const now = new Date();
  const from = new Date(now.getTime() - 90 * 864e5);
  const to = new Date(now.getTime() + 180 * 864e5);

  const url =
    `${ENDPOINT}?serviceKey=${encodeURIComponent(key)}` +
    `&PG_SZ=${opts.size ?? 60}&PAGE=1` +
    `&PAN_NT_ST_DT=${yyyymmdd(from)}&CLSG_DT=${yyyymmdd(to)}`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ac.signal, cache: "no-store" });
    if (!res.ok) return null;

    const body = (await res.json()) as unknown;
    if (!Array.isArray(body)) return null;

    const listBlock = body.find(
      (b): b is { dsList: RawNotice[] } =>
        typeof b === "object" && b !== null && Array.isArray((b as { dsList?: unknown }).dsList),
    );
    if (!listBlock) return [];

    let items = listBlock.dsList.map(toNotice).filter((n) => isResidential(n.category));

    // 지역명이 주어지면 걸러낸다. API 의 CNP_CD_NM 은 "인천광역시 외" 같은 형태다.
    if (opts.region) {
      const hit = items.filter((n) => n.region.includes(opts.region!) || n.title.includes(opts.region!));
      if (hit.length) items = hit;
    }
    return items;
  } catch {
    // 타임아웃·네트워크 오류 — 호출부가 시드로 폴백한다.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toNotice(r: RawNotice): LhNotice {
  return {
    id: r.PAN_ID ?? "",
    title: r.PAN_NM ?? "(제목 없음)",
    type: r.AIS_TP_CD_NM ?? "임대",
    category: r.UPP_AIS_TP_NM ?? "",
    region: r.CNP_CD_NM ?? "전국",
    postedAt: r.PAN_NT_ST_DT ?? "",
    closesAt: r.CLSG_DT ?? "",
    status: r.PAN_SS ?? "",
    url: r.DTL_URL ?? "https://apply.lh.or.kr/",
  };
}

/** 시드 기반 Skill 과 달리 금액이 없으므로 별도 포맷을 쓴다 */
export function noticeFacts(items: LhNotice[]): string {
  if (!items.length) return "조건에 맞는 진행 중인 공고가 없습니다.";
  return items
    .map(
      (n) =>
        `- ${n.title} | ${n.type} | ${n.region} | 게시 ${n.postedAt} | 마감 ${
          isAlwaysOpen(n.closesAt) ? "상시모집" : n.closesAt
        } | 상태 ${n.status}`,
    )
    .join("\n");
}

/** 시드 데이터와 타입을 맞춰야 하는 곳에서 쓰는 어댑터 (금액은 알 수 없음) */
export function asHousingListing(n: LhNotice): Omit<HousingListing, "deposit" | "monthlyRent"> {
  return {
    id: n.id,
    agency: "LH",
    title: n.title,
    region: n.region,
    type: n.type,
    area: "공고문 참조",
    applyFrom: n.postedAt,
    applyTo: n.closesAt,
    eligibility: ["공고문에서 확인"],
    url: n.url,
  };
}
