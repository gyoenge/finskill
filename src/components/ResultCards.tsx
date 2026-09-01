import type {
  DepositProduct,
  FraudPattern,
  HousingListing,
  Scholarship,
  TermDoc,
  YouthPolicy,
} from "@/lib/data/seed";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const manwon = (n: number) => `${n.toLocaleString("ko-KR")}만원`;

/**
 * Skill 이 반환한 Structured Result 를 카드로 렌더링한다 (README §33).
 * LLM 이 만든 문장이 아니라 Skill 이 실제로 가져온 데이터라는 점이 중요하다.
 */
export function ResultCards({ data }: { data: unknown }) {
  const d = data as { kind?: string } | null;
  if (!d?.kind) return null;

  switch (d.kind) {
    case "housing":
      return <HousingCards items={(d as { items: HousingListing[] }).items} />;
    case "scholarship":
      return <ScholarshipCards items={(d as { items: Scholarship[] }).items} />;
    case "policy":
      return <PolicyCards items={(d as { items: YouthPolicy[] }).items} />;
    case "deposit":
      return <DepositCards items={(d as { items: DepositProduct[] }).items} />;
    case "terms":
      return <TermCards items={(d as { items: TermDoc[] }).items} />;
    case "savings":
      return <SavingsCard d={d as never} />;
    case "spending":
      return <SpendingCard d={d as never} />;
    case "goal":
      return <GoalCard d={d as never} />;
    case "tuition":
      return <TuitionCard d={d as never} />;
    case "fraud":
      return <FraudCard d={d as never} />;
    case "credit":
      return <CreditCard d={d as never} />;
    default:
      return null;
  }
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 space-y-2">{children}</div>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-line bg-surface p-3">{children}</div>;
}

function HousingCards({ items }: { items: HousingListing[] }) {
  if (!items.length) return <Empty />;
  return (
    <Frame>
      {items.slice(0, 4).map((h) => (
        <Row key={h.id}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12.5px] font-semibold text-ink-900">{h.title}</p>
            <span className="shrink-0 rounded bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-ink-500">{h.agency}</span>
          </div>
          <p className="mt-1 text-[11.5px] text-ink-500">
            {h.region} · {h.type} · {h.area}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
            <span className="font-bold text-brand-700">보증금 {manwon(h.deposit)}</span>
            <span className="font-bold text-brand-700">월 {manwon(h.monthlyRent)}</span>
            <span className="text-ink-500">
              접수 {h.applyFrom}~{h.applyTo}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-400">자격 · {h.eligibility.join(" / ")}</p>
        </Row>
      ))}
    </Frame>
  );
}

function ScholarshipCards({ items }: { items: Scholarship[] }) {
  if (!items.length) return <Empty />;
  return (
    <Frame>
      {items.slice(0, 4).map((s) => (
        <Row key={s.id}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12.5px] font-semibold text-ink-900">{s.name}</p>
            <span className="shrink-0 text-[11px] font-semibold text-risk-medium">~{s.deadline}</span>
          </div>
          <p className="mt-1 text-[12px] font-bold text-brand-700">{s.amount}</p>
          <p className="mt-1 text-[11px] text-ink-400">
            {s.provider} · 조건 {s.conditions.join(" / ")}
          </p>
        </Row>
      ))}
    </Frame>
  );
}

function PolicyCards({ items }: { items: YouthPolicy[] }) {
  if (!items.length) return <Empty />;
  return (
    <Frame>
      {items.slice(0, 4).map((p) => (
        <Row key={p.id}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12.5px] font-semibold text-ink-900">{p.name}</p>
            <span className="shrink-0 rounded bg-accent-50 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700">
              {p.topic}
            </span>
          </div>
          <p className="mt-1 text-[12px] font-bold text-brand-700">{p.benefit}</p>
          <p className="mt-1 text-[11px] text-ink-400">
            {p.agency} · {p.region} · 신청 {p.deadline}
          </p>
          <p className="mt-1 text-[11px] text-ink-400">자격 · {p.eligibility.join(" / ")}</p>
        </Row>
      ))}
    </Frame>
  );
}

function DepositCards({ items }: { items: DepositProduct[] }) {
  if (!items.length) return <Empty />;
  return (
    <Frame>
      {items.slice(0, 4).map((d) => (
        <Row key={d.id}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12.5px] font-semibold text-ink-900">
              {d.bank} {d.name}
            </p>
            <span className="shrink-0 text-[13px] font-extrabold text-brand-600">최고 {d.maxRate}%</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-400">
            기본 {d.baseRate}% · {d.months.join("·")}개월 · {d.joinWay}
          </p>
          <p className="mt-1 text-[11px] text-ink-500">우대 · {d.conditions.join(" / ")}</p>
        </Row>
      ))}
    </Frame>
  );
}

function TermCards({ items }: { items: TermDoc[] }) {
  return (
    <Frame>
      {items.map((t) => (
        <Row key={t.id}>
          <p className="text-[12.5px] font-semibold text-ink-900">{t.term}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-700">{t.summary}</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">{t.detail}</p>
          <p className="mt-1.5 rounded-lg bg-risk-medium-bg px-2 py-1 text-[11px] text-risk-medium">⚠ {t.caution}</p>
        </Row>
      ))}
    </Frame>
  );
}

function SavingsCard({ d }: { d: { monthly: number; months: number; rate: number; principal: number; interest: number; tax: number; net: number } }) {
  return (
    <Frame>
      <Row>
        <p className="text-[11px] text-ink-400">
          월 {won(d.monthly)} × {d.months}개월 · 연 {d.rate}% (단리)
        </p>
        <p className="mt-1.5 text-[20px] font-extrabold text-brand-700">{won(d.net)}</p>
        <p className="text-[11px] text-ink-400">세후 만기 수령액</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <Mini label="원금" value={won(d.principal)} />
          <Mini label="세전이자" value={won(d.interest)} />
          <Mini label="이자소득세" value={`-${won(d.tax)}`} />
        </div>
      </Row>
    </Frame>
  );
}

function SpendingCard({
  d,
}: {
  d: {
    needsInput?: boolean;
    income: number;
    items: { label: string; value: number }[];
    savingRate: number;
    housingRatio: number;
    reducible: number;
    top?: { label: string; value: number };
  };
}) {
  if (d.needsInput) return <Empty text="수입·지출 정보를 입력하면 분석할 수 있습니다." />;
  const max = Math.max(...d.items.map((i) => i.value), 1);
  return (
    <Frame>
      <Row>
        <div className="flex items-baseline gap-3">
          <span className="text-[20px] font-extrabold text-brand-700">{d.savingRate.toFixed(1)}%</span>
          <span className="text-[11px] text-ink-400">저축률 (권장 20% 이상)</span>
        </div>
        <ul className="mt-3 space-y-1.5">
          {d.items.map((i) => (
            <li key={i.label} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-[11px] text-ink-500">{i.label}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                <span
                  className="dna-bar block h-full rounded-full bg-brand-400"
                  style={{ width: `${(i.value / max) * 100}%` }}
                />
              </span>
              <span className="w-20 shrink-0 text-right text-[11px] font-semibold text-ink-700">{won(i.value)}</span>
            </li>
          ))}
        </ul>
        {d.reducible > 0 && (
          <p className="mt-2.5 rounded-lg bg-brand-50 px-2 py-1.5 text-[11.5px] text-brand-700">
            주거비 비중 {d.housingRatio.toFixed(0)}% → 권장선(25%)까지 낮추면 월 {won(d.reducible)} 절감 가능
          </p>
        )}
      </Row>
    </Frame>
  );
}

function GoalCard({ d }: { d: { needsInput?: boolean; goal: number; months: number; required: number; gap: number; steps: string[] } }) {
  if (d.needsInput) return <Empty text="목표 금액과 기한을 알려주시면 계획을 세울 수 있습니다." />;
  return (
    <Frame>
      <Row>
        <p className="text-[11px] text-ink-400">
          목표 {won(d.goal)} · {d.months}개월
        </p>
        <p className="mt-1 text-[20px] font-extrabold text-brand-700">월 {won(d.required)}</p>
        <ol className="mt-2 space-y-1">
          {d.steps.map((s) => (
            <li key={s} className="text-[11.5px] leading-relaxed text-ink-700">
              {s}
            </li>
          ))}
        </ol>
      </Row>
    </Frame>
  );
}

function TuitionCard({ d }: { d: { needsInput?: boolean; tuition: number; scholarship: number; perSemester: number; monthlyIfSaved: number } }) {
  if (d.needsInput) return <Empty text="학기 등록금 금액을 알려주세요." />;
  return (
    <Frame>
      <Row>
        <p className="text-[11px] text-ink-400">
          등록금 {won(d.tuition)} − 장학금 {won(d.scholarship)}
        </p>
        <p className="mt-1 text-[20px] font-extrabold text-brand-700">{won(d.perSemester)}</p>
        <p className="text-[11px] text-ink-400">학기당 실부담액 · 6개월 분산 시 월 {won(d.monthlyIfSaved)}</p>
      </Row>
    </Frame>
  );
}

function FraudCard({ d }: { d: { score: number; level: string; hits: FraudPattern[]; actions: string[] } }) {
  const tone =
    d.level === "높음" ? "text-risk-high bg-risk-high-bg" : d.level === "주의" ? "text-risk-medium bg-risk-medium-bg" : "text-risk-low bg-risk-low-bg";
  return (
    <Frame>
      <Row>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}>
          위험도 {d.level} · {d.score}/100
        </span>
        {d.hits.length > 0 && (
          <ul className="mt-2 space-y-1">
            {d.hits.map((h) => (
              <li key={h.id} className="text-[11.5px] leading-relaxed text-ink-700">
                <span className="font-semibold text-risk-high">{h.label}</span> — {h.why}
              </li>
            ))}
          </ul>
        )}
        <ol className="mt-2 space-y-1 border-t border-line pt-2">
          {d.actions.slice(0, 3).map((a, i) => (
            <li key={a} className="text-[11.5px] leading-relaxed text-ink-700">
              {i + 1}. {a}
            </li>
          ))}
        </ol>
      </Row>
    </Frame>
  );
}

function CreditCard({ d }: { d: { doc: TermDoc; flags: string[]; actions: string[] } }) {
  return (
    <Frame>
      <Row>
        <p className="text-[12px] leading-relaxed text-ink-700">{d.doc.summary}</p>
        <ol className="mt-2 space-y-1">
          {d.actions.map((a) => (
            <li key={a} className="text-[11.5px] leading-relaxed text-ink-700">
              {a}
            </li>
          ))}
        </ol>
        {d.flags.map((f) => (
          <p key={f} className="mt-1.5 rounded-lg bg-risk-medium-bg px-2 py-1 text-[11px] text-risk-medium">
            ⚠ {f}
          </p>
        ))}
      </Row>
    </Frame>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-canvas px-2 py-1.5">
      <p className="text-[10px] text-ink-400">{label}</p>
      <p className="text-[11.5px] font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function Empty({ text = "조건에 맞는 결과가 없습니다." }: { text?: string }) {
  return <p className="mt-2 rounded-xl border border-dashed border-line px-3 py-4 text-center text-[12px] text-ink-400">{text}</p>;
}
