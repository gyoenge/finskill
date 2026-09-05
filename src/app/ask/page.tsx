"use client";

import { Pio } from "@/components/Brand";

/** 화면 6 — AI Agent 피오 (설계 §30~§32). Phase 2 에서 기존 agent runtime 연결 */
const SUGGESTED = [
  "독립하려면 얼마를 모아야 해?",
  "첫 월급은 어떻게 나누는 게 좋을까?",
  "내가 받을 수 있는 청년지원이 있어?",
  "학자금부터 갚는 게 좋을까?",
];

export default function AskPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div className="flex flex-col items-center text-center">
        <Pio size={64} />
        <h1 className="mt-3 text-[20px] font-extrabold text-fin-navy">피오</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          당신의 Timeline을 알고 있어요. 지금 무엇이 궁금한가요?
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {SUGGESTED.map((q) => (
          <li key={q}>
            <button className="card-soft card-soft-hover w-full px-4 py-3 text-left text-[13px] font-medium text-ink-700">
              {q}
            </button>
          </li>
        ))}
      </ul>
      <div className="card-soft p-4 text-center text-[12px] text-ink-400">
        대화 기능은 다음 단계에서 기존 Agent 엔진과 연결됩니다.
      </div>
    </div>
  );
}
