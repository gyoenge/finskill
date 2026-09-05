"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Pio, PioSays, AssetIcon, Wordmark, eventAsset } from "@/components/Brand";
import { useTimeline } from "@/components/timeline/TimelineStore";
import {
  addLifeEvent,
  birthYearFromAge,
  initFromOnboarding,
  type LifeEventDraft,
} from "@/lib/domain/state";
import { generateFinEvents } from "@/lib/domain/fin-events";
import {
  LIFE_EVENT_CATALOG,
  parseEventDate,
  type Certainty,
  type LifeEventType,
  type LivingType,
  type UserStatus,
} from "@/lib/domain/timeline";

/**
 * 화면 1·2 — Onboarding + Timeline Onboarding (설계 §7·§8·§12).
 * Step 1 현재 상태 → Step 2 내 20대 그리기 → Step 3 Aha Moment(Fin Event 생성).
 */

const STATUS_OPTIONS: { value: UserStatus; label: string; }[] = [
  { value: "student", label: "대학생" },
  { value: "job_seeker", label: "취업 준비" },
  { value: "employee", label: "직장인" },
  { value: "freelancer", label: "프리랜서" },
  { value: "other", label: "기타" },
];

const LIVING_OPTIONS: { value: LivingType; label: string; }[] = [
  { value: "family", label: "본가" },
  { value: "dorm", label: "기숙사" },
  { value: "alone", label: "자취" },
  { value: "other", label: "기타" },
];

const CERTAINTY_OPTIONS: { value: Certainty; label: string; mark: string; }[] = [
  { value: "confirmed", label: "확정", mark: "✓" },
  { value: "expected", label: "예상", mark: "◇" },
  { value: "goal", label: "목표", mark: "☆" },
];

const CURRENT_YEAR = new Date().getFullYear();

type Draft = LifeEventDraft & { key: string; };

function demoTimelineDrafts(): Draft[] {
  const examples: LifeEventDraft[] = [
    { type: "education", subtype: "enroll", title: "대학 입학", date: `${CURRENT_YEAR - 3}-03`, certainty: "confirmed" },
    { type: "finance", subtype: "student-loan", title: "학자금대출", date: `${CURRENT_YEAR - 2}-03`, certainty: "confirmed" },
    { type: "education", subtype: "graduate", title: "졸업", date: `${CURRENT_YEAR + 1}-02`, certainty: "expected" },
    { type: "career", subtype: "employ", title: "취업", date: `${CURRENT_YEAR + 1}-08`, certainty: "expected" },
    { type: "living", subtype: "independence", title: "독립", date: `${CURRENT_YEAR + 2}-03`, certainty: "goal" },
  ];
  return examples.map((draft) => ({ ...draft, key: crypto.randomUUID() }));
}

export default function OnboardingPage() {
  return <Suspense fallback={<p>불러오는 중…</p>}><OnboardingInner /></Suspense>;
}
function OnboardingInner() {
  const router = useRouter();
  const { state, update, ready } = useTimeline();
  const params = useSearchParams();
  const requestedAdding = params.get("mode") === "add";
  const adding = requestedAdding && ready && Boolean(state.user) && !state.isDemo;
  const [step, setStep] = useState<0 | 1 | 2 | 3>(requestedAdding ? 2 : 0);

  useEffect(() => {
    if (ready && requestedAdding && !adding) {
      setStep(1);
      router.replace("/onboarding");
    }
  }, [adding, ready, requestedAdding, router]);

  // Step 1
  const [age, setAge] = useState(25);
  const [status, setStatus] = useState<UserStatus>("job_seeker");
  const [living, setLiving] = useState<LivingType>("family");
  const [region, setRegion] = useState("서울");

  // Step 2
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const sortedDrafts = useMemo(
    () =>
      [...drafts].sort(
        (a, b) =>
          (parseEventDate(a.date)?.getTime() ?? Infinity) - (parseEventDate(b.date)?.getTime() ?? Infinity),
      ),
    [drafts],
  );

  // Aha Moment 미리보기 — 입력한 Life Event 로 생성될 Fin Event 수
  const previewFinCount = useMemo(() => {
    const userId = "me";
    return sortedDrafts.reduce((sum, d) => {
      const le = { ...d, id: "preview", userId, source: "user" as const, status: "future" as const };
      return sum + generateFinEvents(le).length;
    }, 0);
  }, [sortedDrafts]);

  const removeDraft = (key: string) => setDrafts((ds) => ds.filter((d) => d.key !== key));

  const finish = () => {
    const user = {
      id: "me",
      birthYear: birthYearFromAge(age),
      currentStatus: status,
      region: region.trim() || undefined,
      livingType: living,
    };
    const cleaned: LifeEventDraft[] = sortedDrafts.map((d) => ({
      type: d.type,
      subtype: d.subtype,
      title: d.title,
      date: d.date,
      certainty: d.certainty,
    }));
    if (adding) update((existing) => cleaned.reduce((next, draft) => addLifeEvent(next, draft), existing));
    else update(() => initFromOnboarding(user, cleaned));
    router.push("/");
  };

  return (
    <div className="onboarding-shell space-y-6">
      {step === 0 ? <OnboardingWelcome onStart={() => setStep(1)} /> : <>
        <div className="onboarding-intro"><Image src="/brand/20fin-v1/landscape-timeline-mobile.png" fill sizes="(max-width: 767px) 100vw, 800px" alt="" className="onboarding-landscape" /><div><strong>{adding ? "나의 이야기에 다음 계획을 더해요." : "나의 20대, 함께 그려볼까요?"}</strong><p>{adding ? "지금까지의 계획은 그대로 두고 새로운 이벤트를 추가해요." : "정확한 날짜를 몰라도 괜찮아요. 하고 싶은 일부터 시작해요."}</p></div><Pio size={88} mood={step === 3 ? "celebrate" : "guide"} /></div>
        <StepDots step={step} />
      </>}

      {step === 1 && (
        <div className="space-y-5">
          <header className="text-center">
            <h1 className="text-[24px] font-extrabold tracking-tight text-fin-navy">지금의 나를 알려주세요.</h1>
            <p className="mt-1.5 text-[13px] text-ink-500">최소한의 정보만 받아요. 금융정보는 나중에 필요할 때 물어볼게요.</p>
          </header>
          <div className="card-soft space-y-5 p-5">
            <Field label="현재 나이">
              <div className="flex items-center gap-3">
                <input
                  aria-label="현재 나이"
                  type="range"
                  min={18}
                  max={35}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="flex-1 accent-[var(--color-fin-green-500)]"
                />
                <span className="w-14 shrink-0 rounded-lg bg-fin-green-50 py-1 text-center text-[14px] font-extrabold text-fin-green-700">
                  {age}세
                </span>
              </div>
            </Field>
            <Field label="현재 상태">
              <Choices
                options={STATUS_OPTIONS.map((o) => o.label)}
                value={STATUS_OPTIONS.find((o) => o.value === status)!.label}
                onChange={(label) => setStatus(STATUS_OPTIONS.find((o) => o.label === label)!.value)}
              />
            </Field>
            <Field label="현재 거주">
              <Choices
                options={LIVING_OPTIONS.map((o) => o.label)}
                value={LIVING_OPTIONS.find((o) => o.value === living)!.label}
                onChange={(label) => setLiving(LIVING_OPTIONS.find((o) => o.label === label)!.value)}
              />
            </Field>
            <Field label="거주 지역">
              <input
                aria-label="거주 지역"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 서울"
                className="w-40 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-fin-green-500"
              />
            </Field>
            <button
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-fin-green-500 py-3 text-[14px] font-bold text-white transition hover:bg-fin-green-600"
            >
              내 20대 그리기 →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <header className="text-center">
            <h1 className="text-[24px] font-extrabold tracking-tight text-fin-navy">당신의 20대를 그려주세요.</h1>
            <p className="mt-1.5 text-[13px] text-ink-500">
              지금까지 있었던 일과 앞으로 계획하는 일을 추가해주세요. 정확한 날짜를 몰라도 괜찮아요.
            </p>
          </header>

          {drafts.length === 0 && (
            <aside className="onboarding-demo-card">
              <Pio size={58} mood="guide" />
              <div>
                <strong>어떻게 시작할지 막막한가요?</strong>
                <p>졸업부터 취업, 독립까지 이어지는 예시를 먼저 채워볼 수 있어요.</p>
              </div>
              <button type="button" onClick={() => setDrafts(demoTimelineDrafts())}>
                예시로 채워보기
              </button>
            </aside>
          )}

          <EventAdder onAdd={(d) => setDrafts((ds) => [...ds, { ...d, key: crypto.randomUUID() }])} />

          {sortedDrafts.length > 0 ? (
            <div className="card-soft p-4">
              <p className="mb-2 text-[12.5px] font-bold text-ink-700">
                추가한 이벤트 {sortedDrafts.length}개
              </p>
              <ul className="space-y-1.5">
                {sortedDrafts.map((d) => (
                  <li
                    key={d.key}
                    className="flex items-center gap-2.5 rounded-xl bg-canvas px-3 py-2"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fin-green-50 text-fin-green-600">
                      <Icon name={LIFE_EVENT_CATALOG[d.type].icon as never} size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink-900">{d.title}</p>
                      <p className="text-[11px] text-ink-400">
                        {d.date ? d.date.replaceAll("-", ".") : "미정"} ·{" "}
                        {CERTAINTY_OPTIONS.find((c) => c.value === d.certainty)?.label}
                      </p>
                    </div>
                    <button
                      onClick={() => removeDraft(d.key)}
                      className="shrink-0 text-[12px] text-ink-400 hover:text-fin-orange"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <PioSays>졸업·취업·독립처럼 앞으로 계획한 일을 하나씩 추가해 보세요. 지난 일도 좋아요.</PioSays>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => adding ? router.push("/") : setStep(1)}
              className="rounded-xl border border-line px-4 py-3 text-[13px] font-semibold text-ink-500 hover:bg-canvas"
            >
              이전
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={sortedDrafts.length === 0}
              className="flex-1 rounded-xl bg-fin-green-500 py-3 text-[14px] font-bold text-white transition hover:bg-fin-green-600 disabled:cursor-not-allowed disabled:bg-ink-300"
            >
              {sortedDrafts.length === 0 ? "이벤트를 하나 이상 추가해주세요" : "다 그렸어요 →"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <Pio size={80} mood="celebrate" />
            <h1 className="mt-3 text-[22px] font-extrabold tracking-tight text-fin-navy">
              앞으로의 20FIN을 준비했어요.
            </h1>
            <p className="mt-1.5 text-[13px] text-ink-500">
              입력한 {sortedDrafts.length}개의 이벤트를 기반으로 앞으로 챙겨야 할 금융 체크포인트{" "}
              <b className="text-fin-green-700">{previewFinCount}개</b>를 만들었습니다.
            </p>
          </div>

          <div className="card-soft p-5">
            <ol className="relative space-y-3 pl-4">
              {sortedDrafts.map((d) => (
                <li key={d.key} className="relative">
                  <span className="absolute -left-4 top-1.5 h-2 w-2 rounded-full bg-fin-green-400" />
                  <p className="text-[13px] font-bold text-ink-900">
                    {d.date ? d.date.replaceAll("-", ".") : "미정"} · {d.title}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="rounded-xl border border-line px-4 py-3 text-[13px] font-semibold text-ink-500 hover:bg-canvas"
            >
              이전
            </button>
            <button
              disabled={!ready || (adding && !state.user)}
              onClick={finish}
              className="flex-1 rounded-xl bg-fin-green-500 py-3 text-[14px] font-bold text-white transition hover:bg-fin-green-600"
            >
              나의 20대 보기 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OnboardingWelcome({ onStart }: { onStart: () => void }) {
  return <section className="onboarding-welcome">
    <div className="welcome-brand"><Wordmark size={40} /><span>My 20s, Better Finance.</span></div>
    <div className="welcome-visual">
      <Image src="/brand/20fin-v1/landscape-timeline-desktop.png" fill priority sizes="(max-width: 767px) 100vw, 800px" alt="" />
      <Pio size={142} mood="guide" />
    </div>
    <div className="welcome-copy">
      <p className="eyebrow">FINANCE FOR WHAT’S NEXT</p>
      <h1>나의 20대,<br />더 나은 내일로 이어지도록.</h1>
      <p>졸업, 취업, 독립처럼 삶의 중요한 순간을 그리면<br className="welcome-desktop-break" /> 지금 필요한 금융 준비를 피오가 함께 찾아드려요.</p>
    </div>
    <ul className="welcome-benefits" aria-label="20FIN 주요 기능">
      <li><span>01</span><strong>내 일정 중심</strong><small>삶의 이벤트를 시간순으로</small></li>
      <li><span>02</span><strong>지금 할 일만</strong><small>복잡한 금융정보를 간단하게</small></li>
      <li><span>03</span><strong>나에게 맞는 기회</strong><small>놓치기 쉬운 지원정보까지</small></li>
    </ul>
    <button type="button" className="welcome-start" onClick={onStart}>시작하기 <span aria-hidden="true">→</span></button>
    <p className="welcome-note">약 1분이면 나의 첫 타임라인을 만들 수 있어요.</p>
  </section>;
}

/* ------------------------- Event 추가 폼 ------------------------- */

function EventAdder({ onAdd }: { onAdd: (d: LifeEventDraft) => void; }) {
  const [type, setType] = useState<LifeEventType>("education");
  const [subtype, setSubtype] = useState<string>(LIFE_EVENT_CATALOG.education.options[0].subtype);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState<number | "">("");
  const [certainty, setCertainty] = useState<Certainty>("confirmed");

  const cat = LIFE_EVENT_CATALOG[type];
  const option = cat.options.find((o) => o.subtype === subtype) ?? cat.options[0];

  const pickType = (t: LifeEventType) => {
    setType(t);
    setSubtype(LIFE_EVENT_CATALOG[t].options[0].subtype);
  };

  const add = () => {
    const date = month ? `${year}-${String(month).padStart(2, "0")}` : `${year}`;
    onAdd({ type, subtype, title: option.title, date, certainty });
    setMonth("");
  };

  return (
    <div className="card-soft space-y-4 p-4">
      <div className="category-selector flex flex-wrap gap-1.5">
        {(Object.keys(LIFE_EVENT_CATALOG) as LifeEventType[]).map((t) => (
          <button
            key={t}
            aria-pressed={type === t}
            onClick={() => pickType(t)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12.5px] font-semibold transition ${type === t
                ? "border-fin-green-500 bg-fin-green-50 text-fin-green-700"
                : "border-line bg-surface text-ink-500 hover:border-fin-green-200"
              }`}
          >
            <AssetIcon name={eventAsset({ type: t, subtype: "" })} size={42} />
            {{ education: "학업", career: "커리어", living: "주거", finance: "금융", goal: "목표" }[t]}
          </button>
        ))}
      </div>

      <Choices
        options={cat.options.map((o) => o.title)}
        value={option.title}
        onChange={(title) => setSubtype(cat.options.find((o) => o.title === title)!.subtype)}
      />

      <div className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-[11.5px] text-ink-500">연도</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-fin-green-500"
          >
            {Array.from({ length: 16 }, (_, i) => CURRENT_YEAR - 6 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11.5px] text-ink-500">월 (선택)</span>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : "")}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-fin-green-500"
          >
            <option value="">미정</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </select>
        </label>
        <div className="flex-1">
          <span className="mb-1 block text-[11.5px] text-ink-500">확실성</span>
          <div className="flex gap-1.5">
            {CERTAINTY_OPTIONS.map((c) => (
              <button
                key={c.value}
                aria-pressed={certainty === c.value}
                onClick={() => setCertainty(c.value)}
                className={`rounded-lg border px-2.5 py-2 text-[12px] font-semibold transition ${certainty === c.value
                    ? "border-fin-green-500 bg-fin-green-50 text-fin-green-700"
                    : "border-line bg-surface text-ink-400 hover:border-fin-green-200"
                  }`}
              >
                {c.mark} {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={add}
        className="w-full rounded-xl bg-fin-navy py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
      >
        ＋ {option.title} 추가
      </button>
    </div>
  );
}

/* ------------------------- 공통 UI ------------------------- */

function StepDots({ step }: { step: number; }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3].map((s) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all ${s === step ? "w-6 bg-fin-green-500" : s < step ? "w-1.5 bg-fin-green-300" : "w-1.5 bg-line"
            }`}
        />
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode; }) {
  return (
    <div>
      <p className="mb-2 text-[12.5px] font-bold text-fin-navy">{label}</p>
      {children}
    </div>
  );
}

function Choices({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`rounded-xl border px-3 py-1.5 text-[12.5px] font-medium transition ${value === o
              ? "border-fin-green-500 bg-fin-green-50 text-fin-green-700"
              : "border-line bg-surface text-ink-500 hover:border-fin-green-200"
            }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
