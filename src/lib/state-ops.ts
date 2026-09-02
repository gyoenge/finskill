import type {
  Agent,
  Category,
  ChatMessage,
  InstalledSkill,
  OnboardingProfile,
  Skill,
  SkillInput,
  SkillType,
  UserState,
} from "@/lib/types";
import { SKILLS } from "@/lib/data/skills";

/**
 * 사용자 상태 전이 — 전부 순수 함수다.
 *
 * 저장 위치(브라우저 localStorage)와 분리해 두었기 때문에, 나중에 Supabase 로
 * 옮기더라도 이 파일은 그대로 두고 저장 계층만 교체하면 된다.
 * README §26 의 user_skills / agents / agent_skills 스키마를 그대로 따른다.
 */

export const EMPTY_STATE: UserState = {
  profile: null,
  personaId: null,
  installed: [],
  agents: [],
  activeAgentId: null,
  customSkills: [],
  chats: {},
  recentSkillIds: [],
};

/** 기본 카탈로그 + 사용자가 만든 Custom Skill (§21) */
export function allSkills(state: UserState): Skill[] {
  return [...SKILLS, ...state.customSkills];
}

/**
 * Skill 설치.
 *
 * 이미 설치되어 있지만 비활성화된 Skill 은 다시 활성화한다.
 * 그렇지 않으면 Skill Gap(§14) 이 막다른 길이 된다 — 비활성 Skill 은 라우팅에서
 * 제외되어 계속 "부족한 Skill" 로 잡히는데, 설치는 이미 되어 있다는 이유로
 * 아무 일도 일어나지 않아 같은 안내가 무한 반복된다.
 */
export function installSkills(s: UserState, ids: string[]): UserState {
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
  const reEnabled = s.installed.map((i) =>
    requested.has(i.skillId) && !i.enabled ? { ...i, enabled: true } : i,
  );
  return { ...s, installed: [...reEnabled, ...added] };
}

/** 설치 해제 — 장착 중이던 Agent 에서도 함께 뺀다 */
export function uninstallSkill(s: UserState, id: string): UserState {
  return {
    ...s,
    installed: s.installed.filter((i) => i.skillId !== id),
    agents: s.agents.map((a) => ({ ...a, skillIds: a.skillIds.filter((sid) => sid !== id) })),
    customSkills: s.customSkills.filter((c) => c.id !== id),
  };
}

export function toggleSkill(s: UserState, id: string, enabled: boolean): UserState {
  return {
    ...s,
    installed: s.installed.map((i) => (i.skillId === id ? { ...i, enabled } : i)),
  };
}

export function equipSkills(s: UserState, agentId: string, skillIds: string[]): UserState {
  return {
    ...s,
    agents: s.agents.map((a) => (a.id === agentId ? { ...a, skillIds } : a)),
  };
}

export function createAgent(
  s: UserState,
  input: Omit<Agent, "id" | "createdAt">,
): { state: UserState; agent: Agent } {
  const agent: Agent = {
    ...input,
    id: `agent_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  return {
    agent,
    state: {
      ...installSkills(s, input.skillIds),
      agents: [...s.agents, agent],
      activeAgentId: agent.id,
      chats: { ...s.chats, [agent.id]: [] },
    },
  };
}

export function updateAgent(s: UserState, id: string, patch: Partial<Agent>): UserState {
  return {
    ...s,
    agents: s.agents.map((a) => (a.id === id ? { ...a, ...patch, id: a.id } : a)),
  };
}

export function deleteAgent(s: UserState, id: string): UserState {
  const chats = { ...s.chats };
  delete chats[id];
  const agents = s.agents.filter((a) => a.id !== id);
  return {
    ...s,
    agents,
    chats,
    activeAgentId: s.activeAgentId === id ? (agents[0]?.id ?? null) : s.activeAgentId,
  };
}

export function appendMessages(s: UserState, agentId: string, messages: ChatMessage[]): UserState {
  return { ...s, chats: { ...s.chats, [agentId]: [...(s.chats[agentId] ?? []), ...messages] } };
}

export function noteRecentSkills(s: UserState, ids: string[]): UserState {
  return {
    ...s,
    recentSkillIds: [...ids, ...s.recentSkillIds.filter((r) => !ids.includes(r))].slice(0, 6),
  };
}

export function setProfile(
  s: UserState,
  profile: OnboardingProfile,
  personaId: UserState["personaId"],
): UserState {
  return { ...s, profile, personaId };
}

/* ---------------- Custom Skill Builder (§21 → §22 Manifest) ---------------- */

export interface CustomSkillDraft {
  name: string;
  description: string;
  icon?: string;
  category: Category[];
  type: SkillType[];
  inputs: { label: string; kind: SkillInput["kind"] }[];
  outputs: string[];
  dataSource: string;
  instruction: string;
  personalData: boolean;
}

/** No-code 입력을 표준 Skill Manifest 로 변환한다 (§22) */
export function buildCustomSkill(draft: CustomSkillDraft): Skill {
  const id = `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ".");

  return {
    id,
    name: draft.name.trim(),
    version: "0.1.0",
    icon: draft.icon || "puzzle",
    tagline: draft.description.split("\n")[0].slice(0, 60),
    description: draft.description.trim(),
    category: draft.category.length ? draft.category : ["literacy"],
    type: draft.type.length ? draft.type : ["analyze"],
    provider: "내가 만든 Skill",
    dataSources: draft.dataSource ? [draft.dataSource] : ["사용자 입력값"],
    permissions: {
      network: [],
      personalData: draft.personalData,
      writeAction: false,
      financialTransaction: false,
    },
    // 개인 금융정보를 다루면 MEDIUM (§23)
    risk: draft.personalData ? "medium" : "low",
    executor: { type: "calculator", ref: `custom_${id}` },
    passport: {
      canDo: draft.outputs.filter(Boolean),
      cannotDo: ["실제 금융거래", "외부 기관 신청", "개인 계좌 연동"],
      riskReason: draft.personalData
        ? "사용자가 입력한 개인 금융정보를 다루므로 MEDIUM 으로 분류됩니다."
        : "외부 통신 없이 입력값만으로 동작합니다.",
      lastUpdated: today,
    },
    inputs: draft.inputs
      .filter((i) => i.label.trim())
      .map((i, idx) => ({
        key: `field_${idx}`,
        label: i.label.trim(),
        kind: i.kind,
        required: idx === 0,
      })),
    examples: [draft.instruction].filter(Boolean),
    // 1글자 토큰("월", "수" 등)은 오탐이 많아 라우팅 키워드에서 제외한다.
    keywords: [draft.name, ...draft.outputs]
      .filter(Boolean)
      .flatMap((k) => k.split(/\s+/))
      .filter((k) => k.length >= 2)
      .slice(0, 10),
    personas: [],
    rating: 0,
    installCount: 0,
    verified: false,
    createdAt: today,
    custom: true,
    isNew: true,
  };
}

export function addCustomSkill(s: UserState, skill: Skill): UserState {
  return installSkills({ ...s, customSkills: [...s.customSkills, skill] }, [skill.id]);
}
