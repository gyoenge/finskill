import fs from "node:fs";
import path from "node:path";
import type { Agent, ChatMessage, InstalledSkill, Skill, UserState } from "@/lib/types";
import { SKILLS } from "@/lib/data/skills";

/**
 * 파일 기반 사용자 상태 저장소.
 *
 * README §26 의 user_skills / agents / agent_skills 스키마를 그대로 담되,
 * MVP 단계에서는 Supabase 대신 단일 데모 사용자 파일로 유지한다.
 * Supabase 로 옮길 때 이 모듈의 read/write 만 교체하면 된다.
 */

/**
 * 저장 위치.
 *
 * next dev 의 파일 워처가 프로젝트 루트를 감시하기 때문에, 상태 파일을 그 안에 두면
 * 저장할 때마다 Fast Refresh 가 돌아 클라이언트 상태(채팅 입력 등)가 초기화된다.
 * 그래서 워처가 무시하는 node_modules/.cache 아래에 둔다.
 * FINSKILL_STORE_PATH 로 위치를 바꿀 수 있다.
 */
const STORE_PATH =
  process.env.FINSKILL_STORE_PATH ??
  path.join(process.cwd(), "node_modules", ".cache", "finskill", "store.json");

const EMPTY: UserState = {
  profile: null,
  personaId: null,
  installed: [],
  agents: [],
  activeAgentId: null,
  customSkills: [],
  chats: {},
  recentSkillIds: [],
};

function ensureDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readState(): UserState {
  try {
    ensureDir();
    if (!fs.existsSync(STORE_PATH)) return { ...EMPTY };
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<UserState>) };
  } catch {
    return { ...EMPTY };
  }
}

export function writeState(state: UserState): UserState {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), "utf8");
  return state;
}

export function updateState(fn: (s: UserState) => UserState): UserState {
  return writeState(fn(readState()));
}

/** 기본 카탈로그 + 사용자가 만든 Custom Skill (§21) */
export function allSkills(state: UserState = readState()): Skill[] {
  return [...SKILLS, ...state.customSkills];
}

export function skillById(id: string, state: UserState = readState()): Skill | undefined {
  return allSkills(state).find((s) => s.id === id);
}

/**
 * Skill 설치.
 *
 * 이미 설치되어 있지만 비활성화된 Skill 은 다시 활성화한다.
 * 그렇지 않으면 Skill Gap(§14) 이 막다른 길이 된다 — 비활성 Skill 은 라우팅에서
 * 제외되어 계속 "부족한 Skill" 로 잡히는데, 설치 버튼은 이미 설치되어 있다는
 * 이유로 아무 일도 하지 않아 사용자가 같은 안내를 무한히 반복해서 보게 된다.
 */
export function installSkills(ids: string[]): UserState {
  return updateState((s) => {
    const now = new Date().toISOString();
    const existing = new Set(s.installed.map((i) => i.skillId));
    const requested = new Set(ids);
    const catalog = allSkills(s);
    const added: InstalledSkill[] = ids
      .filter((id) => !existing.has(id))
      .map((id) => ({
        skillId: id,
        version: catalog.find((c) => c.id === id)?.version ?? "1.0.0",
        enabled: true,
        installedAt: now,
      }));
    // 이미 설치된 것 중 비활성 상태인 Skill 은 다시 켠다.
    const reEnabled = s.installed.map((i) =>
      requested.has(i.skillId) && !i.enabled ? { ...i, enabled: true } : i,
    );
    return { ...s, installed: [...reEnabled, ...added] };
  });
}

export function uninstallSkill(id: string): UserState {
  return updateState((s) => ({
    ...s,
    installed: s.installed.filter((i) => i.skillId !== id),
    agents: s.agents.map((a) => ({ ...a, skillIds: a.skillIds.filter((sid) => sid !== id) })),
  }));
}

export function toggleSkill(id: string, enabled: boolean): UserState {
  return updateState((s) => ({
    ...s,
    installed: s.installed.map((i) => (i.skillId === id ? { ...i, enabled } : i)),
  }));
}

export function createAgent(input: Omit<Agent, "id" | "createdAt">): { state: UserState; agent: Agent } {
  const agent: Agent = {
    ...input,
    id: `agent_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  const state = updateState((s) => ({
    ...s,
    agents: [...s.agents, agent],
    activeAgentId: agent.id,
    chats: { ...s.chats, [agent.id]: [] },
  }));
  return { state, agent };
}

export function updateAgent(id: string, patch: Partial<Agent>): UserState {
  return updateState((s) => ({
    ...s,
    agents: s.agents.map((a) => (a.id === id ? { ...a, ...patch, id: a.id } : a)),
  }));
}

export function deleteAgent(id: string): UserState {
  return updateState((s) => {
    const chats = { ...s.chats };
    delete chats[id];
    const agents = s.agents.filter((a) => a.id !== id);
    return {
      ...s,
      agents,
      chats,
      activeAgentId: s.activeAgentId === id ? (agents[0]?.id ?? null) : s.activeAgentId,
    };
  });
}

export function appendMessages(agentId: string, messages: ChatMessage[]): UserState {
  return updateState((s) => ({
    ...s,
    chats: { ...s.chats, [agentId]: [...(s.chats[agentId] ?? []), ...messages] },
  }));
}

export function noteRecentSkills(ids: string[]): UserState {
  return updateState((s) => ({
    ...s,
    recentSkillIds: [...ids, ...s.recentSkillIds.filter((r) => !ids.includes(r))].slice(0, 6),
  }));
}

export function resetState(): UserState {
  return writeState({ ...EMPTY });
}
