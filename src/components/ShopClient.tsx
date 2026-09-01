"use client";

import { useMemo, useState } from "react";
import type { Category, PersonaId, Skill, SkillType } from "@/lib/types";
import { CATEGORY_LABEL, PERSONAS, TYPE_LABEL, TYPE_TO_AXIS } from "@/lib/data/personas";
import { SkillCard } from "@/components/SkillCard";
import { EmptyState } from "@/components/ui";

type Sort = "popular" | "new" | "rating";

/** 화면 02. Skill Shop (README §7.1, §27) */
export function ShopClient({ catalog, installedIds }: { catalog: Skill[]; installedIds: string[] }) {
  const installed = useMemo(() => new Set(installedIds), [installedIds]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [type, setType] = useState<SkillType | "all">("all");
  const [persona, setPersona] = useState<PersonaId | "all">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("popular");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = catalog.filter((s) => {
      if (needle) {
        const hay = `${s.name} ${s.tagline} ${s.description} ${s.keywords.join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (category !== "all" && !s.category.includes(category)) return false;
      if (type !== "all" && !s.type.includes(type)) return false;
      if (persona !== "all" && !s.personas.includes(persona)) return false;
      if (verifiedOnly && !s.verified) return false;
      return true;
    });
    out = out.sort((a, b) => {
      if (sort === "new") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "rating") return b.rating - a.rating;
      return b.installCount - a.installCount;
    });
    return out;
  }, [catalog, q, category, type, persona, verifiedOnly, sort]);

  const axisGroups = useMemo(() => {
    const groups: Record<string, SkillType[]> = { FIND: [], UNDERSTAND: [], MANAGE: [], PROTECT: [] };
    (Object.keys(TYPE_LABEL) as SkillType[]).forEach((t) => groups[TYPE_TO_AXIS[t]].push(t));
    return groups;
  }, []);

  return (
    <div className="space-y-5">
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="어떤 금융 능력이 필요하세요? (예: 월세, 장학금, 적금)"
          className="w-full rounded-2xl border border-line bg-surface py-3 pl-11 pr-4 text-[13.5px] text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400"
        />
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px]">🔍</span>
      </div>

      <div className="space-y-2.5">
        <FilterRow label="분야">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            전체
          </Chip>
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="기능">
          <Chip active={type === "all"} onClick={() => setType("all")}>
            전체
          </Chip>
          {Object.entries(axisGroups).map(([axis, types]) => (
            <span key={axis} className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-wider text-ink-300">{axis}</span>
              {types.map((t) => (
                <Chip key={t} active={type === t} onClick={() => setType(t)}>
                  {TYPE_LABEL[t]}
                </Chip>
              ))}
            </span>
          ))}
        </FilterRow>

        <FilterRow label="Persona">
          <Chip active={persona === "all"} onClick={() => setPersona("all")}>
            전체
          </Chip>
          {PERSONAS.map((p) => (
            <Chip key={p.id} active={persona === p.id} onClick={() => setPersona(p.id)}>
              {p.icon} {p.name}
            </Chip>
          ))}
        </FilterRow>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] font-medium text-ink-500">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--color-brand-600)]"
          />
          Verified Skill 만 보기
        </label>
        <div className="flex items-center gap-1">
          {(["popular", "new", "rating"] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold transition ${
                sort === s ? "bg-canvas text-ink-900" : "text-ink-400 hover:text-ink-700"
              }`}
            >
              {s === "popular" ? "인기순" : s === "new" ? "신규순" : "평점순"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[12px] text-ink-400">{list.length}개의 Skill</p>

      {list.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <SkillCard key={s.id} skill={s} installed={installed.has(s.id)} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="🔍"
          title="조건에 맞는 Skill 이 없습니다"
          desc="검색어나 필터를 바꿔보세요. 원하는 능력이 없다면 Skill Builder 로 직접 만들 수도 있습니다."
        />
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-14 shrink-0 pt-1.5 text-[11px] font-bold text-ink-400">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1 text-[12px] font-medium transition ${
        active ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-surface text-ink-500 hover:border-brand-300"
      }`}
    >
      {children}
    </button>
  );
}
