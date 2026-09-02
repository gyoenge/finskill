import Image from "next/image";
import { Icon } from "@/components/Icon";

/**
 * FinSkill BI.
 *
 * 왼쪽 = 로봇 얼굴(AI), 오른쪽 = ₩ 퍼즐 조각(금융).
 * 두 조각이 맞물려 "필요한 금융 능력을 연결한다"를 표현한다 (README §29).
 *
 * 원본 아이콘(public/logo.png)은 336×244 로 가로가 넓어 size 는 높이 기준이다.
 */

const RATIO = 336 / 244;

export function LogoMark({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="FinSkill"
      width={Math.round(size * RATIO)}
      height={size}
      className={className}
      priority
    />
  );
}

export function LogoWordmark({ size = 30 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="text-[17px] font-extrabold tracking-tight text-ink-900">FinSkill</span>
    </span>
  );
}

/** 홈 Hero 배너의 일러스트 — 로고 주위에 금융 지표 칩이 떠 있는 구성 */
export function HeroArt() {
  return (
    <div className="relative h-[150px] w-[220px] shrink-0">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <LogoMark size={92} />
      </div>
      <Chip className="left-0 top-2" tone="accent">
        <Icon name="chart" size={17} />
      </Chip>
      <Chip className="right-0 top-0" tone="brand">
        <Icon name="card" size={17} />
      </Chip>
      <Chip className="bottom-1 left-3" tone="brand">
        <Icon name="pie" size={17} />
      </Chip>
      <Chip className="bottom-4 right-1" tone="accent">
        <Icon name="check" size={17} />
      </Chip>
    </div>
  );
}

function Chip({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className: string;
  tone: "brand" | "accent";
}) {
  return (
    <span
      className={`absolute flex h-9 w-9 items-center justify-center rounded-xl bg-surface shadow-[0_6px_16px_-8px_rgba(27,42,56,0.35)] ring-1 ${
        tone === "brand" ? "text-brand-600 ring-brand-100" : "text-accent-600 ring-accent-100"
      } ${className}`}
    >
      {children}
    </span>
  );
}
