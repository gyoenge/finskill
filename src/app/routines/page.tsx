"use client";

import Link from "next/link";
import { useState } from "react";
import type { Routine, RoutineKind } from "@/lib/types";
import { useStore, Loading } from "@/components/StoreProvider";
import * as ops from "@/lib/state-ops";
import { isDue, isExpired } from "@/lib/agent/routines";
import { Button, Card, EmptyState, LinkButton, SectionHeader } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";

/** 루틴 종류별 기본값 — 사용자가 고르면 나머지는 알아서 채워진다 */
const PRESETS: {
  kind: RoutineKind;
  icon: IconName;
  name: string;
  desc: string;
  every: Routine["every"];
  withinDays?: number;
}[] = [
  {
    kind: "deadline",
    icon: "target",
    name: "마감 감시",
    desc: "장학금·공고 마감이 다가오면 D-day 로 알려줍니다.",
    every: "daily",
    withinDays: 7,
  },
  {
    kind: "policy-change",
    icon: "megaphone",
    name: "제도 변경 감시",
    desc: "새로 생기거나 바뀐 청년정책을 찾아냅니다.",
    every: "weekly",
  },
  {
    kind: "monthly-review",
    icon: "chart",
    name: "월간 금융 점검",
    desc: "저축률과 지출 구조를 한 달에 한 번 정리합니다.",
    every: "monthly",
  },
  {
    kind: "custom",
    icon: "puzzle",
    name: "직접 만들기",
    desc: "관심 키워드와 주기를 직접 정합니다.",
    every: "daily",
  },
];

const EVERY_LABEL: Record<Routine["every"], string> = {
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export default function RoutinesPage() {
  const { state, ready, update } = useStore();
  const [openForm, setOpenForm] = useState<RoutineKind | null>(null);
  const [keyword, setKeyword] = useState("");
  const [every, setEvery] = useState<Routine["every"]>("daily");
  const [days, setDays] = useState(14);
  const [limited, setLimited] = useState(true);

  if (!ready) return <Loading />;

  const agentId = state.activeAgentId ?? state.agents[0]?.id ?? "";

  const create = (preset: (typeof PRESETS)[number]) => {
    const name = keyword.trim() ? `${preset.name} · ${keyword.trim()}` : preset.name;
    update((s) => {
      const { state: next } = ops.addRoutine(s, {
        name,
        kind: preset.kind,
        agentId,
        enabled: true,
        every: preset.kind === "custom" ? every : preset.every,
        startsAt: todayStr(),
        // "2주간 매일" 처럼 기간을 한정할 수 있게 한다.
        endsAt: limited ? plusDays(days) : undefined,
        target: {
          keyword: keyword.trim() || undefined,
          withinDays: preset.withinDays,
        },
      });
      return next;
    });
    setOpenForm(null);
    setKeyword("");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">루틴</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            에이전트가 알아서 챙겨야 할 일을 등록해 두세요. 마감·정책 변화를 대신 확인합니다.
          </p>
        </div>
        {state.agents.length === 0 && (
          <LinkButton href="/agents/new" size="sm">
            먼저 에이전트 만들기
          </LinkButton>
        )}
      </header>

      {/* 지금은 접속 시 실행된다는 점을 숨기지 않는다 */}
      <Card className="flex items-start gap-2.5 border-accent-200 bg-accent-50 p-3.5">
        <span className="mt-0.5 text-accent-600">
          <Icon name="signal" size={16} />
        </span>
        <p className="text-[12px] leading-relaxed text-accent-700">
          <b>지금은 접속했을 때 실행됩니다.</b> 브라우저를 닫아둔 동안에는 돌지 않습니다. 서버 예약 실행과
          아침 알림은 준비 중이며, 연결되면 접속하지 않아도 정해진 시각에 확인해 드립니다.
        </p>
      </Card>

      <section>
        <SectionHeader title="루틴 추가" desc="종류를 고르면 주기와 조건이 채워집니다." />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p) => (
            <Card as="li" key={p.kind} hover className="flex flex-col p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon name={p.icon} size={20} />
              </span>
              <p className="mt-3 text-[13.5px] font-bold text-ink-900">{p.name}</p>
              <p className="mt-1 flex-1 text-[11.5px] leading-relaxed text-ink-500">{p.desc}</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                disabled={!agentId}
                onClick={() => {
                  setOpenForm(p.kind);
                  setEvery(p.every);
                }}
              >
                ＋ 추가
              </Button>
            </Card>
          ))}
        </ul>

        {openForm && (
          <Card className="fade-up mt-3 space-y-3.5 p-4">
            <p className="text-[13px] font-bold text-ink-900">
              {PRESETS.find((p) => p.kind === openForm)?.name} 설정
            </p>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-ink-900">
                관심 키워드 <span className="font-normal text-ink-400">(선택)</span>
              </span>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 이공계, 관악구, 월세"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] outline-none focus:border-brand-400"
              />
              <span className="mt-1 block text-[11px] text-ink-400">
                비워두면 내 조건에 맞는 것 전체를 봅니다.
              </span>
            </label>

            {openForm === "custom" && (
              <div>
                <span className="mb-1.5 block text-[12px] font-semibold text-ink-900">주기</span>
                <div className="flex gap-1.5">
                  {(["daily", "weekly", "monthly"] as const).map((e) => (
                    <button
                      key={e}
                      onClick={() => setEvery(e)}
                      className={`rounded-xl border px-3 py-1.5 text-[12.5px] font-medium transition ${
                        every === e
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-line bg-surface text-ink-500 hover:border-brand-300"
                      }`}
                    >
                      {EVERY_LABEL[e]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={limited}
                  onChange={(e) => setLimited(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--color-brand-600)]"
                />
                <span className="text-[12.5px] text-ink-700">기간을 정해두기</span>
              </label>
              {limited && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={days}
                    onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-brand-400"
                  />
                  <span className="text-[12.5px] text-ink-500">
                    일간 · {plusDays(days)} 까지
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setOpenForm(null)}>
                취소
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => create(PRESETS.find((p) => p.kind === openForm)!)}
              >
                루틴 만들기
              </Button>
            </div>
          </Card>
        )}
      </section>

      <section>
        <SectionHeader title="내 루틴" desc={`${state.routines.length}개 등록됨`} />
        {state.routines.length === 0 ? (
          <EmptyState
            icon="target"
            title="등록된 루틴이 없습니다"
            desc="마감 감시를 하나 걸어두면 자격 되는 장학금·공고의 마감을 놓치지 않습니다."
          />
        ) : (
          <ul className="space-y-2.5">
            {state.routines.map((r) => {
              const expired = isExpired(r);
              const due = isDue(r);
              return (
                <Card as="li" key={r.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        r.enabled && !expired ? "bg-brand-50 text-brand-600" : "bg-canvas text-ink-300"
                      }`}
                    >
                      <Icon
                        name={PRESETS.find((p) => p.kind === r.kind)?.icon ?? "puzzle"}
                        size={20}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[13.5px] font-bold text-ink-900">{r.name}</p>
                        {expired ? (
                          <span className="rounded bg-canvas px-1.5 py-0.5 text-[10.5px] font-bold text-ink-400">
                            기간 종료
                          </span>
                        ) : due ? (
                          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-bold text-brand-700">
                            확인 예정
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-ink-500">
                        {EVERY_LABEL[r.every]} 확인
                        {r.endsAt && ` · ${r.endsAt} 까지`}
                        {r.target.keyword && ` · "${r.target.keyword}"`}
                        {r.lastRunAt && ` · 마지막 ${r.lastRunAt.slice(0, 10)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        role="switch"
                        aria-checked={r.enabled}
                        aria-label={r.enabled ? "루틴 끄기" : "루틴 켜기"}
                        onClick={() => update((s) => ops.updateRoutine(s, r.id, { enabled: !r.enabled }))}
                        className={`relative h-6 w-11 rounded-full transition ${
                          r.enabled ? "bg-brand-500" : "bg-line"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                            r.enabled ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => update((s) => ops.deleteRoutine(s, r.id))}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      {state.routineRuns.length > 0 && (
        <section>
          <SectionHeader title="실행 기록" desc="최근 확인한 결과입니다." />
          <ul className="space-y-2">
            {state.routineRuns.slice(0, 8).map((run) => (
              <Card as="li" key={run.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-[11px] text-ink-400">{run.ranAt.slice(5, 16).replace("T", " ")}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-700">
                  <b className="font-semibold">{run.routineName}</b> · {run.summary}
                </span>
                {run.findings.length > 0 && (
                  <span className="shrink-0 rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-700">
                    {run.findings.length}건
                  </span>
                )}
              </Card>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-[11px] text-ink-400">
        루틴은 이 브라우저에만 저장됩니다.{" "}
        <Link href="/shop" className="font-semibold text-brand-700 hover:underline">
          스킬을 더 설치하면
        </Link>{" "}
        확인 범위가 넓어집니다.
      </p>
    </div>
  );
}
