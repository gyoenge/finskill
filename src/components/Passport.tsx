import type { Skill } from "@/lib/types";
import { Card, RiskBadge, VerifiedBadge } from "@/components/ui";

/**
 * Skill Passport (README §16, 화면 09)
 * 출처 / 권한 / 위험 / 할 수 있는 것 / 할 수 없는 것 / 갱신일을 투명하게 공개한다.
 */
export function SkillPassport({ skill }: { skill: Skill }) {
  const p = skill.permissions;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-canvas px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold tracking-wide text-ink-900">SKILL PASSPORT</span>
          <VerifiedBadge verified={skill.verified} />
        </div>
        <RiskBadge level={skill.risk} />
      </div>

      <dl className="divide-y divide-line text-[12px]">
        <Row label="DATA SOURCE">
          <ul className="space-y-0.5">
            {skill.dataSources.map((d) => (
              <li key={d} className="text-ink-700">
                {d}
              </li>
            ))}
          </ul>
        </Row>

        <Row label="CAN DO">
          <ul className="flex flex-wrap gap-1">
            {skill.passport.canDo.map((c) => (
              <li key={c} className="rounded-md bg-brand-50 px-1.5 py-0.5 font-medium text-brand-700">
                {c}
              </li>
            ))}
          </ul>
        </Row>

        <Row label="CANNOT DO">
          <ul className="flex flex-wrap gap-1">
            {skill.passport.cannotDo.map((c) => (
              <li key={c} className="rounded-md bg-risk-high-bg px-1.5 py-0.5 font-medium text-risk-high line-through decoration-risk-high/40">
                {c}
              </li>
            ))}
          </ul>
        </Row>

        <Row label="PERMISSION">
          <ul className="space-y-1 text-ink-700">
            <Perm label="개인정보" on={p.personalData} onText="사용자 입력 기반 접근" offText="없음" />
            <Perm
              label="외부통신"
              on={p.network.length > 0}
              onText={p.network.join(" · ")}
              offText="없음 (로컬 계산)"
            />
            <Perm label="데이터 쓰기" on={p.writeAction} onText="허용" offText="없음" />
            <Perm label="금융실행" on={p.financialTransaction} onText="허용" offText="없음" danger />
          </ul>
        </Row>

        <Row label="RISK">
          <p className="text-ink-700">
            <span className="font-bold uppercase">{skill.risk}</span> — {skill.passport.riskReason}
          </p>
        </Row>

        <Row label="LAST UPDATED">
          <p className="text-ink-700">
            {skill.passport.lastUpdated} · v{skill.version} · {skill.provider}
          </p>
        </Row>
      </dl>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 px-4 py-3">
      <dt className="text-[10px] font-bold tracking-wider text-ink-400">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Perm({
  label,
  on,
  onText,
  offText,
  danger = false,
}: {
  label: string;
  on: boolean;
  onText: string;
  offText: string;
  danger?: boolean;
}) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="w-16 shrink-0 text-ink-400">{label}</span>
      <span className={on ? (danger ? "font-semibold text-risk-high" : "font-medium text-risk-medium") : "text-ink-500"}>
        {on ? onText : offText}
      </span>
    </li>
  );
}
