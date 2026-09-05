import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { BottomNav, SideNav } from "@/components/Nav";
import { Wordmark } from "@/components/Brand";
import { TimelineProvider } from "@/components/timeline/TimelineStore";
export const metadata: Metadata = { title: "20FIN — 20대의 다음을 준비하는 금융", description: "삶의 일정에 맞춰 필요한 금융정보와 다음 행동을 함께 준비해요." };
export default function RootLayout({ children }: { children: React.ReactNode ;}) {
  return <html lang="ko"><body><a className="skip-link" href="#main-content">본문으로 이동</a><TimelineProvider><div className="app-shell"><SideNav /><div className="app-body"><header className="mobile-header"><Link href="/" aria-label="20FIN 홈"><Wordmark size={28} /></Link><Link href="/ask">피오에게 물어보기 ↗</Link></header><main id="main-content" className="app-content">{children}</main></div><BottomNav /></div></TimelineProvider></body></html>;
}
