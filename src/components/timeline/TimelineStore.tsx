"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_STATE, recomputeStatuses, type TimelineState } from "@/lib/domain/state";

/**
 * 20FIN 상태 저장소 (localStorage).
 *
 * Vercel 서버리스는 파일시스템이 읽기 전용이라 서버에 상태를 둘 수 없다.
 * 그래서 사용자 상태(User·Life Event·Fin Event·대화)는 전부 브라우저에 두고
 * 서버는 무상태로 유지한다. 나중에 Supabase 로 옮기려면 이 파일만 교체하면 된다.
 */

const KEY = "20fin.state.v1";

interface StoreValue {
  state: TimelineState;
  ready: boolean;
  update: (fn: (s: TimelineState) => TimelineState) => void;
  getState: () => TimelineState;
  reset: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

function readStored(): TimelineState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return { ...EMPTY_STATE, ...(JSON.parse(raw) as Partial<TimelineState>) };
  } catch {
    return null;
  }
}

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimelineState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const stateRef = useRef<TimelineState>(EMPTY_STATE);

  useEffect(() => {
    // 저장된 상태가 없으면 빈 상태로 시작하고 AppShell이 온보딩으로 안내한다.
    const stored = readStored();
    const initial = stored ? recomputeStatuses(stored) : EMPTY_STATE;
    stateRef.current = initial;
    setState(initial);
    setReady(true);
  }, []);

  const persist = useCallback((next: TimelineState) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // 저장 실패해도 화면 동작은 계속된다.
    }
  }, []);

  const update = useCallback(
    (fn: (s: TimelineState) => TimelineState) => {
      const next = fn(stateRef.current);
      stateRef.current = next;
      persist(next);
      setState(next);
    },
    [persist],
  );

  const getState = useCallback(() => stateRef.current, []);

  const reset = useCallback(() => {
    const next = EMPTY_STATE;
    stateRef.current = next;
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
    setState(next);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({ state, ready, update, getState, reset }),
    [state, ready, update, getState, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTimeline(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTimeline 은 TimelineProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}

export function TimelineLoading() {
  return (
    <div className="space-y-3 py-10">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-2xl bg-surface"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}
