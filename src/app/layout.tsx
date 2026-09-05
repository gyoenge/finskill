import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { TimelineProvider } from "@/components/timeline/TimelineStore";
export const metadata: Metadata = { title: "20FIN — 20대의 다음을 준비하는 금융", description: "삶의 일정에 맞춰 필요한 금융정보와 다음 행동을 함께 준비해요." };
export default function RootLayout({ children }: { children: React.ReactNode ;}) {
  return <html lang="ko"><body><a className="skip-link" href="#main-content">본문으로 이동</a><TimelineProvider><AppShell>{children}</AppShell></TimelineProvider></body></html>;
}
