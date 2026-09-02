"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore, Loading } from "@/components/StoreProvider";
import { CATEGORY_LABEL, TYPE_LABEL, TYPE_TO_AXIS } from "@/lib/data/personas";
import { Card, CategoryChip, FreeBadge, HashChip, IconTile, Rating, RiskBadge, SectionHeader, TypeChip, VerifiedBadge } from "@/components/ui";
import { SkillPassport } from "@/components/Passport";
import { InstallButton } from "@/components/actions";
import { SkillCard } from "@/components/SkillCard";

/** 화면 03. Skill Detail + 화면 09. Skill Passport (README §27) */
export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, catalog } = useStore();
  const skill = catalog.find((s) => s.id === id);

  // 기본 카탈로그는 SSR 에서 바로 잡히고, Custom Skill 만 하이드레이션 후에 합류한다.
  // 따라서 "없는 Skill" 판정은 스토어를 읽은 뒤에만 내린다.
  if (!skill) {
    if (!ready) return <Loading />;
    return (
      <div className="py-16 text-center">
        <p className="text-[15px] font-semibold text-ink-900">존재하지 않는 Skill 입니다.</p>
        <Link href="/shop" className="mt-2 inline-block text-[13px] font-semibold text-brand-700 hover:underline">
          ← 스킬샵으로 돌아가기
        </Link>
      </div>
    );
  }

  const installed = state.installed.some((i) => i.skillId === skill.id);
  const equippedAgents = state.agents.filter((a) => a.skillIds.includes(skill.id));
  const related = catalog
    .filter((s) => s.id !== skill.id && s.category.some((c) => skill.category.includes(c)))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <Link href="/shop" className="inline-block text-[12px] font-semibold text-ink-400 hover:text-brand-700">
        ← 스킬샵으로 돌아가기
      </Link>

      {/* 시안: 스킬 상세 헤더 */}
      <header className="flex flex-wrap items-start gap-4">
        <IconTile icon={skill.icon} category={skill.category[0]} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">{skill.name}</h1>
            <FreeBadge />
            <Rating value={skill.rating} count={skill.installCount} />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {skill.category.map((c) => (
              <HashChip key={c} label={CATEGORY_LABEL[c]} />
            ))}
            {skill.personas.length > 0 && <HashChip label={skill.personas.length + "개 Persona 추천"} />}
          </div>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-500">{skill.description}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <VerifiedBadge verified={skill.verified} />
            <RiskBadge level={skill.risk} />
            <span className="rounded bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-ink-400">
              v{skill.version}
            </span>
          </div>
        </div>
        <div className="w-full sm:w-44">
          <InstallButton skillId={skill.id} installed={installed} size="md" fullWidth />
          {equippedAgents.length > 0 ? (
            <p className="mt-2 text-center text-[11px] text-ink-400">
              {equippedAgents.map((a) => a.name).join(", ")} 에 장착됨
            </p>
          ) : installed ? (
            <p className="mt-2 text-center text-[11px] text-risk-medium">
              아직 Agent 에 장착되지 않았습니다.{" "}
              <Link href="/my-skills" className="font-semibold underline underline-offset-2">
                나의 스킬에서 장착
              </Link>
            </p>
          ) : null}
        </div>
      </header>

      {/* 시안: 이 스킬로 할 수 있어요 / 이 스킬을 추가하면 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-[13px] font-bold text-ink-900">이 스킬로 할 수 있어요</p>
          <ul className="mt-2.5 space-y-1.5">
            {skill.passport.canDo.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[12.5px] text-ink-700">
                <CheckIcon />
                {c}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <p className="text-[13px] font-bold text-ink-900">이 스킬은 할 수 없어요</p>
          <ul className="mt-2.5 space-y-1.5">
            {skill.passport.cannotDo.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[12.5px] text-ink-500">
                <CrossIcon />
                {c}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card className="p-4">
            <h2 className="text-[13px] font-bold text-ink-900">이 Skill 은 무엇을 하나요?</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-700">{skill.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skill.category.map((c) => (
                <CategoryChip key={c} c={c} />
              ))}
              {skill.type.map((t) => (
                <TypeChip key={t} t={t} />
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-[13px] font-bold text-ink-900">기능</h2>
            <ul className="mt-2 space-y-1.5">
              {skill.type.map((t) => (
                <li key={t} className="flex items-center gap-2 text-[12.5px] text-ink-700">
                  <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-ink-400">
                    {TYPE_TO_AXIS[t]}
                  </span>
                  <span className="font-semibold">{TYPE_LABEL[t]}</span>
                  <span className="text-ink-400">
                    ·{" "}
                    {t === "search"
                      ? "정보 탐색"
                      : t === "match"
                        ? "사용자 조건 매칭"
                        : t === "compare"
                          ? "선택지 비교"
                          : t === "explain"
                            ? "정보 설명"
                            : t === "calculate"
                              ? "금융 계산"
                              : t === "analyze"
                                ? "데이터 분석"
                                : t === "plan"
                                  ? "행동계획"
                                  : t === "protect"
                                    ? "위험 탐지"
                                    : "외부 행동"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-xl bg-canvas px-3 py-2.5">
              <p className="text-[11px] font-bold tracking-wider text-ink-400">실행 방식</p>
              <p className="mt-0.5 text-[12.5px] text-ink-700">
                {skill.executor.type === "http"
                  ? "API Skill — 외부 공공 API 를 호출해 원본 데이터를 가져옵니다."
                  : skill.executor.type === "rag"
                    ? "RAG Skill — 공식 문서를 검색해 근거 기반으로 설명합니다."
                    : "Calculator Skill — 금융 계산을 결정론적 코드로 수행합니다. LLM 이 숫자를 추정하지 않습니다."}
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-[13px] font-bold text-ink-900">사용 예시</h2>
            <ul className="mt-2 space-y-1.5">
              {skill.examples.map((ex) => (
                <li key={ex} className="rounded-xl bg-canvas px-3 py-2 text-[12.5px] text-ink-700">
                  “{ex}”
                </li>
              ))}
            </ul>
            {skill.inputs.length > 0 && (
              <>
                <p className="mt-3.5 text-[11px] font-bold tracking-wider text-ink-400">입력 항목</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {skill.inputs.map((i) => (
                    <li key={i.key} className="rounded-lg border border-line px-2 py-1 text-[11.5px] text-ink-500">
                      {i.label}
                      {i.unit ? ` (${i.unit})` : ""}
                      {i.required && <span className="ml-0.5 text-risk-high">*</span>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="text-[13px] font-bold text-ink-900">데이터 출처</h2>
            <ul className="mt-2 space-y-1.5">
              {skill.dataSources.map((d) => (
                <li key={d} className="flex items-center gap-2 text-[12.5px] text-ink-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-400">
              제공자 {skill.provider} · 최종 갱신 {skill.passport.lastUpdated}
            </p>
          </Card>
        </div>

        <div className="space-y-5">
          <SkillPassport skill={skill} />

          <Card className="p-4">
            <h2 className="text-[13px] font-bold text-ink-900">Rating</h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[26px] font-extrabold text-ink-900">{skill.rating.toFixed(1)}</span>
              <span className="text-[12px] text-ink-400">/ 5.0</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
              <div className="dna-bar h-full rounded-full bg-brand-500" style={{ width: `${(skill.rating / 5) * 100}%` }} />
            </div>
            <p className="mt-2 text-[11.5px] text-ink-400">
              {skill.installCount.toLocaleString("ko-KR")}명이 설치했습니다.
            </p>
          </Card>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <SectionHeader
            title="함께 보면 좋은 Skill"
            desc={`${skill.category.map((c) => CATEGORY_LABEL[c]).join(" · ")} 분야의 다른 능력입니다.`}
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s) => (
              <SkillCard key={s.id} skill={s} installed={state.installed.some((i) => i.skillId === s.id)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="var(--color-brand-50)" />
      <path
        d="M8 12.3l2.7 2.7L16 9.7"
        stroke="var(--color-brand-600)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="var(--color-risk-high-bg)" />
      <path
        d="M9 9l6 6M15 9l-6 6"
        stroke="var(--color-risk-high)"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
