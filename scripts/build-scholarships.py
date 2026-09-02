#!/usr/bin/env python3
"""
한국장학재단 학자금지원정보 CSV → TypeScript 시드 생성기.

공공데이터포털의 이 데이터는 실시간 API 가 아니라 주기적으로 갱신되는 파일이다.
과거 공고까지 전부 들어 있어(2022~2026, 1,859건 중 1,808건이 이미 마감)
그대로 쓰면 만료된 장학금을 "지원 가능"으로 안내하게 된다.
그래서 파일 기준일 시점에 아직 모집 중이던 건만 추린다.

사용법:
    python3 scripts/build-scholarships.py data/한국장학재단_....csv

CSV 를 새로 받으면 이 스크립트를 다시 돌리면 된다.
"""
import csv, io, json, re, sys, datetime, pathlib

KEEP = [
    ("운영기관명", "provider"),
    ("상품명", "name"),
    ("운영기관구분", "providerType"),
    ("학자금유형구분", "kind"),
    ("학년구분", "grades"),
    ("학과구분", "majors"),
    ("지원내역 상세내용", "amount"),
    ("소득기준 상세내용", "income"),
    ("성적기준 상세내용", "grade"),
    ("지역거주여부 상세내용", "region"),
    ("홈페이지 주소", "url"),
    ("모집시작일", "applyFrom"),
    ("모집종료일", "applyTo"),
]


def trim(s: str, n: int = 120) -> str:
    s = (s or "").replace("○", " ").replace("\n", " ").replace("\r", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s[:n].strip()


def parse_date(s: str):
    try:
        return datetime.datetime.strptime((s or "").strip(), "%Y-%m-%d").date()
    except ValueError:
        return None


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("사용법: python3 scripts/build-scholarships.py <csv 경로>")
    path = pathlib.Path(sys.argv[1])

    # 공공데이터포털 CSV 는 대부분 CP949 로 내려온다.
    raw = path.read_bytes()
    text = None
    for enc in ("cp949", "utf-8-sig", "utf-8"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        sys.exit("인코딩을 판별하지 못했습니다.")

    # 파일명에서 기준일을 뽑는다 (…_20260811.csv)
    m = re.search(r"(\d{4})(\d{2})(\d{2})", path.name)
    snapshot = datetime.date(int(m[1]), int(m[2]), int(m[3])) if m else datetime.date.today()

    rows = list(csv.DictReader(io.StringIO(text)))
    kept = []
    for i, r in enumerate(rows):
        end = parse_date(r.get("모집종료일", ""))
        if not end or end < snapshot:
            continue  # 기준일에 이미 마감된 공고
        rec = {"id": f"kosaf-{i}"}
        for src, dst in KEEP:
            rec[dst] = trim(r.get(src, ""))
        kept.append(rec)

    kept.sort(key=lambda r: r["applyTo"])

    body = ",\n".join("  " + json.dumps(r, ensure_ascii=False) for r in kept)
    out = f'''/**
 * 한국장학재단 학자금지원정보(대학생) — 실제 공공데이터.
 *
 * ⚠️ 자동 생성 파일이다. 직접 고치지 말고 scripts/build-scholarships.py 를 다시 돌릴 것.
 *
 * 원본은 실시간 API 가 아니라 주기 갱신 파일이라 과거 공고까지 들어 있다.
 * 전체 {len(rows):,}건 중 기준일({snapshot}) 시점에 모집 중이던 {len(kept)}건만 남겼다.
 * 실행 시점에 이미 마감된 건은 executor 가 한 번 더 걸러낸다.
 */

export const SCHOLARSHIP_SNAPSHOT_DATE = "{snapshot}";
export const SCHOLARSHIP_SOURCE = "한국장학재단 학자금지원정보(대학생) · 공공데이터포털";

export interface ScholarshipRecord {{
  id: string;
  provider: string;
  name: string;
  providerType: string;
  kind: string;
  grades: string;
  majors: string;
  amount: string;
  income: string;
  grade: string;
  region: string;
  url: string;
  applyFrom: string;
  applyTo: string;
}}

export const SCHOLARSHIPS_REAL: ScholarshipRecord[] = [
{body}
];
'''
    dest = pathlib.Path("src/lib/data/seed/scholarships.ts")
    dest.write_text(out, encoding="utf-8")
    print(f"전체 {len(rows)}건 → 기준일({snapshot}) 이후 마감 {len(kept)}건 생성")
    print(f"→ {dest} ({dest.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
