import { NextResponse } from "next/server";
import type { Category, Skill, SkillInput, SkillType } from "@/lib/types";
import { installSkills, updateState } from "@/lib/store";

interface Draft {
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

/**
 * Custom Skill Builder (README §21)
 * No-code 입력을 Skill Manifest(§22)로 자동 변환한다.
 */
export async function POST(req: Request) {
  const draft = (await req.json()) as Draft;
  if (!draft?.name?.trim() || !draft?.description?.trim()) {
    return NextResponse.json({ error: "Skill 이름과 설명은 필수입니다." }, { status: 400 });
  }

  const id = `custom-${Date.now().toString(36)}`;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ".");

  const skill: Skill = {
    id,
    name: draft.name.trim(),
    version: "0.1.0",
    icon: draft.icon || "🧩",
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

  updateState((s) => ({ ...s, customSkills: [...s.customSkills, skill] }));
  const state = installSkills([id]);

  return NextResponse.json({ skill, state });
}
