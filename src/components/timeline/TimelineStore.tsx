"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_STATE, recomputeStatuses, type TimelineState } from "@/lib/domain/state";
import { demoState } from "@/lib/domain/demo";

/**
 * 20FIN 상태 저장소 (localStorage).
 *
 * StoreProvider(FinSkill)와 같은 패턴이되 20FIN Timeline 상태를 담는다.
 * 마이그레이션 기간에는 두 프로바이더가 공존하고, 구 FinSkill 페이지가
 * 모두 제거되면 StoreProvider 를 걷어낸다.
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
    // 저장된 상태가 없으면 데모 시드로 시작한다 (온보딩 미완료 방문자에게 즉시 Timeline 노출).
    const stored = readStored();
    const initial = stored ? recomputeStatuses(stored) : demoState();
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
    const next = demoState();
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
