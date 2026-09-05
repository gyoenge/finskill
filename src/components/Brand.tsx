import Image from "next/image";
import type { LifeEvent } from "@/lib/domain/timeline";

export const ASSET_ROOT = "/brand/20fin-v1";
export function Wordmark({ size = 32 }: { size?: number; }) {
  return <span className="wordmark" style={{ fontSize: size }} aria-label="20FIN"><span>20</span>FIN<i aria-hidden="true">✦</i></span>;
}
export type PioMood = "default" | "thinking" | "guide" | "celebrate" | "support";
export function Pio({ size = 48, mood = "default" }: { size?: number; mood?: PioMood; }) {
  return <Image src={`${ASSET_ROOT}/pio-${mood}.png`} width={size} height={size} sizes={`${size}px`} alt="" className="brand-image" style={{ width: size, height: size }} />;
}
export function AssetIcon({ name, size = 48 }: { name: string; size?: number; }) {
  return <Image src={`${ASSET_ROOT}/${name}.png`} width={size} height={size} sizes={`${size}px`} alt="" className="brand-image" style={{ width: size, height: size }} />;
}
export function eventAsset(event: Pick<LifeEvent, "type" | "subtype">): string {
  if (event.subtype === "student-loan" || event.subtype === "loan") return "event-student-loan";
  if (event.subtype === "first-salary") return "event-first-salary";
  return ({ education: "event-education", career: "event-career", living: "event-housing", finance: "event-savings", goal: "event-goal" })[event.type];
}
export function PioSays({ children }: { children: React.ReactNode; }) {
  return <div className="pio-message"><Pio size={52} mood="guide" /><div>{children}</div></div>;
}
