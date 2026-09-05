/**
 * 20FIN 브랜드 요소 — Wordmark 와 마스코트 피오(Pio).
 * 피오는 장식이 아니라 AI Agent 의 목소리로만 쓴다 (설계 §60·§61).
 */

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-baseline font-extrabold tracking-tight text-fin-navy"
      style={{ fontSize: size }}
      aria-label="20FIN"
    >
      20
      <span className="text-fin-green-500">FIN</span>
    </span>
  );
}

/** 노란 병아리 + 머리에 초록 새싹 + 작은 주황 부리 (설계 §59) */
export function Pio({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {/* 새싹 */}
      <path d="M24 9c0-2.5-2-4.5-4.5-4.5 0 2.5 2 4.5 4.5 4.5z" fill="var(--color-fin-green-500)" />
      <path d="M24 9c0-2.5 2-4.5 4.5-4.5 0 2.5-2 4.5-4.5 4.5z" fill="var(--color-fin-green-600)" />
      <path d="M24 9v3" stroke="var(--color-fin-green-600)" strokeWidth="1.6" strokeLinecap="round" />
      {/* 몸통 */}
      <circle cx="24" cy="28" r="15" fill="var(--color-fin-yellow)" />
      {/* 눈 */}
      <circle cx="19" cy="25" r="1.7" fill="var(--color-fin-navy)" />
      <circle cx="29" cy="25" r="1.7" fill="var(--color-fin-navy)" />
      {/* 부리 */}
      <path d="M24 28l-3 2 3 2 3-2-3-2z" fill="var(--color-fin-orange)" />
      {/* 볼 */}
      <circle cx="15.5" cy="29.5" r="2" fill="var(--color-fin-orange)" opacity="0.35" />
      <circle cx="32.5" cy="29.5" r="2" fill="var(--color-fin-orange)" opacity="0.35" />
    </svg>
  );
}

/** 피오가 말하는 말풍선 블록 (Onboarding·Empty State·추천 메시지) */
export function PioSays({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-fin-yellow-bg px-4 py-3">
      <span className="shrink-0">
        <Pio size={36} />
      </span>
      <p className="pt-0.5 text-[13px] leading-relaxed text-fin-navy">{children}</p>
    </div>
  );
}
