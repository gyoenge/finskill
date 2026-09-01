"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Skill, UserState } from "@/lib/types";
import { EMPTY_STATE, allSkills } from "@/lib/state-ops";

/**
 * 브라우저 localStorage 기반 상태 저장소.
 *
 * Vercel 서버리스는 파일시스템이 읽기 전용이라 서버에 상태를 둘 수 없다.
 * 그래서 사용자 상태(설치한 Skill, Agent, 대화기록)는 전부 브라우저에 두고
 * 서버는 무상태로 유지한다. 방문자마다 자신의 Skill·Agent 를 갖게 된다.
 *
 * 상태 전이 로직은 src/lib/state-ops.ts 의 순수 함수가 담당하므로,
 * 나중에 Supabase 로 옮기려면 이 파일만 교체하면 된다.
 */

const KEY = "finskill.state.v1";

interface StoreValue {
  state: UserState;
  /** localStorage 를 읽기 전에는 false — SSR/hydration 불일치를 막는다 */
  ready: boolean;
  catalog: Skill[];
  update: (fn: (s: UserState) => UserState) => void;
  /**
   * 항상 최신 상태를 돌려준다.
   * update() 직후에는 아직 리렌더가 일어나지 않아 렌더 시점의 state 가 낡아 있다.
   * "장착하고 바로 이어서 실행" 같은 흐름은 이 함수로 최신 값을 읽어야 한다.
   */
  getState: () => UserState;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function readStored(): UserState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_STATE };
    return { ...EMPTY_STATE, ...(JSON.parse(raw) as Partial<UserState>) };
  } catch {
    // 손상된 값이거나 접근이 막힌 경우(프라이빗 모드 등) 빈 상태로 시작한다.
    return { ...EMPTY_STATE };
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  // 리렌더를 기다리지 않고 최신 상태를 읽기 위한 참조
  const stateRef = useRef<UserState>(EMPTY_STATE);

  // localStorage 는 서버에 없으므로 마운트 후에 읽는다.
  useEffect(() => {
    const stored = readStored();
    stateRef.current = stored;
    setState(stored);
    setReady(true);
  }, []);

  const persist = useCallback((next: UserState) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // 용량 초과나 저장 차단 시에도 화면 동작은 계속되어야 한다.
    }
  }, []);

  const update = useCallback(
    (fn: (s: UserState) => UserState) => {
      // 낡은 클로저 대신 참조를 기준으로 계산해 연속 호출에도 값이 유실되지 않게 한다.
      const next = fn(stateRef.current);
      stateRef.current = next;
      persist(next);
      setState(next);
    },
    [persist],
  );

  const getState = useCallback(() => stateRef.current, []);

  const reset = useCallback(() => {
    const next = { ...EMPTY_STATE };
    stateRef.current = next;
    persist(next);
    setState(next);
  }, [persist]);

  const value = useMemo<StoreValue>(
    () => ({ state, ready, catalog: allSkills(state), update, getState, reset }),
    [state, ready, update, getState, reset],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore 는 StoreProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}

/** localStorage 를 읽기 전 화면 깜빡임을 막는 자리표시자 */
export function Loading() {
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
