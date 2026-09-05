"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pio } from "@/components/Brand";
import { useTimeline } from "@/components/timeline/TimelineStore";
import { PersonalContextBar } from "@/components/PersonalContextBar";
import type { ChatMessage, Decision } from "@/lib/domain/state";

/** 화면 6 — AI Agent 피오 (설계 §30~§32). Timeline Context 를 아는 대화형 Agent. */

const THREAD = "pio";
const SUGGESTED = [
  "독립하려면 얼마를 모아야 해?",
  "첫 월급은 어떻게 나누는 게 좋을까?",
  "내가 받을 수 있는 청년지원이 있어?",
  "적금 먼저 할까, 학자금부터 갚을까?",
];

export default function AskPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-[13px] text-ink-400">불러오는 중…</div>}>
      <AskInner />
    </Suspense>
  );
}

function AskInner() {
  const { state, update, ready } = useTimeline();
  const params = useSearchParams();
  const eventId = params.get("event") ?? undefined;
  const focusEvent = eventId ? state.lifeEvents.find((e) => e.id === eventId) : undefined;

  const messages = useMemo<ChatMessage[]>(() => state.chats[THREAD] ?? [], [state.chats]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || pending || !ready) return;
    setInput("");

    const userMessage: ChatMessage = {
      id: `m_${Date.now().toString(36)}`,
      role: "user",
      content: msg,
      lifeEventId: eventId,
      createdAt: new Date().toISOString(),
    };
    update((s) => ({ ...s, chats: { ...s.chats, [THREAD]: [...(s.chats[THREAD] ?? []), userMessage] } }));
    setPending(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          lifeEventId: eventId,
          context: {
            user: state.user,
            lifeEvents: state.lifeEvents,
            finEvents: state.finEvents,
            financialContext: state.financialContext,
          },
          history: (state.chats[THREAD] ?? []).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error("대화 요청 실패");
      const data = (await res.json()) as { answer: string; decision: Decision | null; };
      if (typeof data.answer !== "string") throw new Error("응답 형식 오류");
      const agentMessage: ChatMessage = {
        id: `m_${Date.now().toString(36)}_a`,
        role: "agent",
        content: data.answer,
        decision: data.decision ?? undefined,
        createdAt: new Date().toISOString(),
      };
      update((s) => ({ ...s, chats: { ...s.chats, [THREAD]: [...(s.chats[THREAD] ?? []), agentMessage] } }));
    } catch {
      const errMessage: ChatMessage = {
        id: `m_${Date.now().toString(36)}_e`,
        role: "agent",
        content: "답변을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        createdAt: new Date().toISOString(),
      };
      update((s) => ({ ...s, chats: { ...s.chats, [THREAD]: [...(s.chats[THREAD] ?? []), errMessage] } }));
    } finally {
      setPending(false);
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="chat-page">
      <header className="chat-heading"><Pio size={48} /><div><h1>피오와 함께 생각해요</h1><p>{focusEvent ? `${focusEvent.title} 계획에 대한 대화` : "나의 타임라인을 아는 금융 동반자"}</p></div></header>
      <PersonalContextBar compact />
      {empty ? (
        <div className="chat-empty flex flex-1 flex-col items-center justify-center text-center">
          <Pio size={112} mood="guide" />
          <h1 className="mt-3 text-[20px] font-extrabold text-fin-navy">어떤 내일을 준비하고 있나요?</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {ready && state.user ? `${new Date().getFullYear() - state.user.birthYear}세 · ` : ""}
            나의 계획을 바탕으로 함께 생각해볼게요.
          </p>
          {focusEvent && (
            <p className="mt-2 rounded-full bg-fin-green-50 px-3 py-1 text-[12px] font-semibold text-fin-green-700">
              {focusEvent.title} 계획에 대해 물어보는 중
            </p>
          )}
          <ul className="mt-5 grid w-full gap-2 sm:grid-cols-2">
            {(focusEvent ? [`${focusEvent.title}까지 뭘 준비해야 해?`, ...SUGGESTED.slice(0, 3)] : SUGGESTED).map((q) => (
              <li key={q}>
                <button
                  disabled={pending || !ready}
                  onClick={() => send(q)}
                  className="card-soft card-soft-hover w-full px-4 py-3 text-left text-[13px] font-medium text-ink-700"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="chat-log space-y-5" role="log" aria-label="피오와 나눈 대화" aria-live="polite">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {pending && (
            <div className="flex items-center gap-2 text-[13px] text-ink-400">
              <Pio size={40} mood="thinking" />
              <span className="flex gap-1">
                <Dot /> <Dot /> <Dot />
              </span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      )}

      {/* 입력 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="chat-form flex items-center gap-2"
      >
        <input
          aria-label="피오에게 보낼 질문"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="피오에게 물어보세요"
          disabled={pending || !ready}
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-[14px] outline-none focus:border-fin-green-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || !ready || !input.trim()}
          className="rounded-xl bg-fin-green-500 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-fin-green-600 disabled:cursor-not-allowed disabled:bg-ink-300"
        >
          보내기
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage; }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-fin-green-500 px-4 py-2.5 text-[13.5px] leading-relaxed text-white">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0">
        <Pio size={30} />
      </span>
      <div className="min-w-0 max-w-[85%] space-y-3">
        <div className="rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-[13.5px] leading-relaxed text-ink-900 ring-1 ring-line">
          <AnswerText text={message.content} />
        </div>
        {message.decision && <DecisionCard decision={message.decision} />}
      </div>
    </div>
  );
}

/** '- ' 불릿과 문단을 간단히 렌더 */
function AnswerText({ text }: { text: string; }) {
  const lines = text.split("\n").filter((l) => l.trim());
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const bullet = /^\s*[-•]\s+/.test(line);
        return bullet ? (
          <div key={i} className="flex gap-1.5">
            <span className="text-fin-green-500">•</span>
            <span>{line.replace(/^\s*[-•]\s+/, "")}</span>
          </div>
        ) : (
          <p key={i}>{line}</p>
        );
      })}
    </div>
  );
}

/** Decision UI — 추천 + 비교표 + Why (설계 §32) */
function DecisionCard({ decision }: { decision: Decision; }) {
  const columns = useMemo(() => {
    const keys = new Set<string>();
    decision.options.forEach((o) => Object.keys(o.columns ?? {}).forEach((k) => keys.add(k)));
    return [...keys];
  }, [decision.options]);

  return (
    <div className="card-soft decision-card overflow-hidden">
      <div className="bg-fin-green-50 px-4 py-3">
        <p className="text-[11px] font-bold text-fin-green-700">피오의 제안</p>
        <p className="mt-0.5 text-[14px] font-extrabold text-fin-navy">{decision.recommendation}</p>
      </div>

      {decision.options.length > 0 && columns.length > 0 && (
        <div className="overflow-x-auto px-2 py-2">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-ink-400">
                <th className="px-2 py-1.5 text-left font-semibold">전략</th>
                {columns.map((c) => (
                  <th key={c} className="px-2 py-1.5 text-right font-semibold">{c}</th>
                ))}
                <th className="px-2 py-1.5 text-left font-semibold">특징</th>
              </tr>
            </thead>
            <tbody>
              {decision.options.map((o, i) => (
                <tr key={i} className={o.recommended ? "rounded-lg bg-fin-green-50 font-bold text-fin-green-700" : "text-ink-700"}>
                  <td className="px-2 py-1.5">
                    {o.label}
                    {o.recommended && <span className="ml-1 text-[10px]">추천</span>}
                  </td>
                  {columns.map((c) => (
                    <td key={c} className="px-2 py-1.5 text-right tabular-nums">{o.columns?.[c] ?? "-"}</td>
                  ))}
                  <td className="px-2 py-1.5 text-[11px] text-ink-500">{o.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {decision.why.length > 0 && (
        <div className="border-t border-line px-4 py-3">
          <p className="text-[11px] font-bold text-ink-400">왜 이렇게 추천했나요?</p>
          <ol className="mt-1 space-y-1">
            {decision.why.map((w, i) => (
              <li key={i} className="flex gap-1.5 text-[12px] text-ink-700">
                <span className="font-bold text-fin-green-600">{i + 1}</span>
                {w}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-ink-300 pulse-dot" />;
}
