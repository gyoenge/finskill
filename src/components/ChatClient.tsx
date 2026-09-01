"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Agent, ChatMessage, Skill } from "@/lib/types";
import { Card, IconTile } from "@/components/ui";
import { SkillTrace } from "@/components/Trace";
import { SkillGapPanel } from "@/components/SkillGapPanel";
import { useStore } from "@/components/StoreProvider";
import * as ops from "@/lib/state-ops";
import { SKILLS } from "@/lib/data/skills";

/** 화면 07. Agent Chat (README §12, §13, §19, §27) */
export function ChatClient({
  agent,
  equipped,
  disabled = [],
  initialMessages,
}: {
  agent: Agent;
  equipped: Skill[];
  /** 장착됐지만 비활성화된 Skill — 실행되지 않는 이유를 보여주기 위해 함께 표시한다 */
  disabled?: Skill[];
  initialMessages: ChatMessage[];
}) {
  const { update, getState } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  /** 지금 토큰을 받고 있는 말풍선 — 커서를 여기에만 그린다 */
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  /**
   * /api/chat 은 SSE 로 user → trace → gap? → delta* → done 순서로 이벤트를 보낸다.
   * Trace 가 먼저 도착하므로 답변 토큰을 기다리는 동안에도 화면이 채워진다.
   */
  const send = async (text: string) => {
    const query = text.trim();
    if (!query || busy) return;

    const draftId = `draft_${Date.now().toString(36)}`;
    setInput("");
    setError("");
    setBusy(true);
    setStreamingId(draftId);
    setMessages((prev) => [
      ...prev,
      { id: `local_${Date.now()}`, role: "user", content: query, createdAt: new Date().toISOString() },
      { id: draftId, role: "agent", content: "", createdAt: new Date().toISOString() },
    ]);

    /** 진행 중인 Agent 말풍선만 갱신한다. */
    const patchDraft = (fn: (m: ChatMessage) => ChatMessage) =>
      setMessages((prev) => prev.map((m) => (m.id === draftId ? fn(m) : m)));

    try {
      // 서버는 무상태다. 이번 요청에 필요한 것만 함께 보낸다.
      // Skill Gap 승인 직후처럼 방금 장착한 Skill 이 있을 수 있으므로,
      // props 가 아니라 스토어의 최신 상태에서 장착 목록을 다시 계산한다.
      const cur = getState();
      const curAgent = cur.agents.find((a) => a.id === agent.id) ?? agent;
      const curCatalog = [...SKILLS, ...cur.customSkills];
      const enabledIds = new Set(cur.installed.filter((i) => i.enabled).map((i) => i.skillId));
      const equippedNow = curAgent.skillIds
        .filter((id) => enabledIds.has(id))
        .map((id) => curCatalog.find((c) => c.id === id))
        .filter((sk): sk is Skill => Boolean(sk));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: curAgent,
          equipped: equippedNow,
          customSkills: cur.customSkills,
          history: messages.slice(-6),
          message: query,
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error((await res.json().catch(() => ({}))).error ?? "응답에 실패했습니다.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE 는 빈 줄로 이벤트를 구분한다. 마지막 조각은 미완성일 수 있어 버퍼에 남긴다.
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const ev = JSON.parse(line.slice(6));

          if (ev.type === "trace") patchDraft((m) => ({ ...m, trace: ev.trace }));
          else if (ev.type === "gap") patchDraft((m) => ({ ...m, gap: ev.gap }));
          else if (ev.type === "delta") patchDraft((m) => ({ ...m, content: m.content + ev.text }));
          else if (ev.type === "reset") patchDraft((m) => ({ ...m, content: "" }));
          else if (ev.type === "done") {
            const finalMessage: ChatMessage = ev.message;
            setMessages((prev) => prev.map((m) => (m.id === draftId ? finalMessage : m)));
            // 대화 기록 저장도 클라이언트가 한다.
            update((s) => {
              const withMsgs = ops.appendMessages(s, agent.id, [
                { id: `msg_${Date.now().toString(36)}_u`, role: "user", content: query, createdAt: new Date().toISOString() },
                finalMessage,
              ]);
              return ev.usedSkillIds?.length
                ? ops.noteRecentSkills(withMsgs, ev.usedSkillIds)
                : withMsgs;
            });
          } else if (ev.type === "error") {
            setError(ev.error);
            setMessages((prev) => prev.filter((m) => m.id !== draftId));
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "응답에 실패했습니다.");
      setMessages((prev) => prev.filter((m) => m.id !== draftId));
    } finally {
      setBusy(false);
      setStreamingId(null);
    }
  };

  const suggestions = equipped.slice(0, 3).flatMap((s) => s.examples.slice(0, 1));

  return (
    <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
      <Card className="flex h-[calc(100vh-13rem)] min-h-[32rem] flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[19px]">
            🤖
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-bold text-ink-900">{agent.name}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-ink-400">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              활성 · 스킬 {equipped.length}개
            </p>
          </div>
          <Link href="/my-skills" className="shrink-0 text-[11.5px] font-semibold text-ink-400 hover:text-brand-700">
            ⚙︎ 설정
          </Link>
        </div>

        {/* Conversation */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-[26px]">💬</span>
              <p className="text-[14px] font-semibold text-ink-900">무엇을 도와드릴까요?</p>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-ink-500">
                장착된 Skill 을 조합해 답변합니다. 필요한 Skill 이 없으면 무엇이 부족한지 알려드립니다.
              </p>
              <ul className="mt-1 flex flex-wrap justify-center gap-1.5">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => send(s)}
                      className="rounded-xl border border-line bg-surface px-3 py-1.5 text-[12px] text-ink-500 transition hover:border-brand-300 hover:text-brand-700"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              {m.role === "user" ? (
                <p className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-500 px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-[0_6px_16px_-10px_rgba(18,184,134,0.9)]">
                  {m.content}
                </p>
              ) : (
                <div className="fade-up max-w-[92%]">
                  {/* 스트리밍 초기에는 본문이 비어 있다. 빈 말풍선 대신 진행 표시를 띄운다. */}
                  {m.content ? (
                    <div className="card-soft rounded-2xl rounded-bl-md px-3.5 py-3">
                      <MessageText text={m.content} cursor={m.id === streamingId} />
                    </div>
                  ) : (
                    <Thinking
                      equipped={equipped}
                      label={m.trace?.length ? "결과를 정리하는 중…" : "Skill 을 선택하고 실행하는 중…"}
                    />
                  )}
                  {m.trace && m.trace.length > 0 && <SkillTrace trace={m.trace} sources={m.sources} />}
                  {m.gap && m.gap.missing.length > 0 && (
                    <SkillGapPanel
                      gap={m.gap}
                      agentId={agent.id}
                      lastQuery={lastUserQuery(messages, m.id)}
                      onContinue={(q) => send(q)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}

          {error && <p className="text-[12px] text-risk-high">{error}</p>}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 border-t border-line px-3 py-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="예: 서울에서 자취하는 대학생인데 이번 학기 돈을 좀 아끼고 싶어."
            className="max-h-32 flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="보내기"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 12l16-8-5.5 16-3-6.5L4 12z"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
        </form>
      </Card>

      {/* 현재 장착 Skill */}
      <div className="space-y-4">
        <Card className="p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[13px] font-bold text-ink-900">현재 장착 Skill</p>
            <Link href="/shop" className="text-[11.5px] font-semibold text-brand-700 hover:underline">
              더 찾기
            </Link>
          </div>
          {equipped.length === 0 ? (
            <p className="rounded-xl bg-canvas px-3 py-3 text-[12px] leading-relaxed text-ink-500">
              장착된 Skill 이 없습니다. Agent 는 답변할 근거를 가질 수 없습니다.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {equipped.map((s) => (
                <li key={s.id} className="flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2">
                  <IconTile icon={s.icon} category={s.category[0]} size={34} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/shop/${s.id}`}
                      className="block truncate text-[12.5px] font-semibold text-ink-900 hover:text-brand-700"
                    >
                      {s.name}
                    </Link>
                    <p className="truncate text-[11px] text-ink-400">
                      {s.executor.type === "http" ? "API" : s.executor.type === "rag" ? "RAG" : "Calculator"} ·{" "}
                      {s.dataSources[0]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {disabled.length > 0 && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="text-[11px] font-bold text-risk-medium">꺼져 있어 실행되지 않는 Skill</p>
              <ul className="mt-1.5 space-y-1">
                {disabled.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 rounded-lg bg-risk-medium-bg px-2 py-1.5">
                    <span className="text-[13px] grayscale">{s.icon}</span>
                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-ink-500">{s.name}</span>
                    <span className="shrink-0 rounded bg-white/70 px-1 text-[10px] font-bold text-risk-medium">OFF</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/my-skills"
                className="mt-1.5 inline-block text-[11px] font-semibold text-brand-700 hover:underline"
              >
                My Skills 에서 다시 켜기 →
              </Link>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <p className="text-[13px] font-bold text-ink-900">이 Agent 가 할 수 없는 일</p>
          <ul className="mt-2 space-y-1 text-[11.5px] text-ink-500">
            <li>· 실제 신청 · 계약 · 결제</li>
            <li>· 송금, 투자 주문, 대출 실행</li>
            <li>· 개인 계좌 · 카드 자동 연동</li>
            <li>· 개인 맞춤 투자자문</li>
          </ul>
          <p className="mt-2.5 rounded-xl bg-canvas px-3 py-2 text-[11px] leading-relaxed text-ink-400">
            FinSkill 은 정보 탐색·이해·계획을 돕고, 실행은 사용자가 공식 창구에서 직접 합니다. (§23)
          </p>
        </Card>
      </div>
    </div>
  );
}

/**
 * Agent 답변 렌더러.
 * LLM 이 **굵게** 와 '- ' 불릿을 쓰므로 그대로 두면 기호가 노출된다.
 * dangerouslySetInnerHTML 없이 최소한의 마크다운만 해석한다.
 */
function MessageText({ text, cursor }: { text: string; cursor: boolean }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-[13px] leading-relaxed text-ink-900">
      {lines.map((line, i) => {
        const bullet = /^\s*[-•]\s+/.test(line);
        const body = bullet ? line.replace(/^\s*[-•]\s+/, "") : line;
        if (!body.trim()) return <div key={i} className="h-1.5" />;
        const content = (
          <>
            {bold(body)}
            {cursor && i === lines.length - 1 && (
              <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 bg-brand-500 pulse-dot" />
            )}
          </>
        );
        return bullet ? (
          <div key={i} className="flex gap-1.5 pl-0.5">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-500" />
            <span className="min-w-0">{content}</span>
          </div>
        ) : (
          <p key={i}>{content}</p>
        );
      })}
    </div>
  );
}

/** **굵게** 만 해석한다 */
function bold(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-bold text-ink-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** 답변 토큰이 도착하기 전까지 보여주는 진행 표시 */
function Thinking({ equipped, label }: { equipped: Skill[]; label: string }) {
  return (
    <div className="fade-up flex items-center gap-2 rounded-2xl bg-canvas px-3.5 py-3">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="pulse-dot h-1.5 w-1.5 rounded-full bg-brand-500"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      <span className="text-[12px] text-ink-500">{label}</span>
      <span className="ml-auto flex gap-0.5">
        {equipped.slice(0, 6).map((s) => (
          <span key={s.id} className="text-[13px] opacity-60">
            {s.icon}
          </span>
        ))}
      </span>
    </div>
  );
}

/** Skill Gap 승인 후 이어서 실행할 원래 질문을 찾는다 (Flow C) */
function lastUserQuery(messages: ChatMessage[], agentMessageId: string): string {
  const idx = messages.findIndex((m) => m.id === agentMessageId);
  for (let i = idx - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}
