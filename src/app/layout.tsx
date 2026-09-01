import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { BottomNav, PuzzleMark, SideNav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "FinSkill — 필요한 금융 능력을 연결하다",
  description:
    "필요한 금융 AI Skill을 골라 장착하고, 나만의 금융 Agent를 만드는 Skill Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans antialiased">
        <div className="flex min-h-screen">
          <SideNav />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
              <Link href="/" className="flex items-center gap-2">
                <PuzzleMark size={20} />
                <span className="text-[15px] font-extrabold text-ink-900">FinSkill</span>
              </Link>
              <Link href="/onboarding" className="text-[12px] font-semibold text-brand-700">
                Persona 설정
              </Link>
            </header>
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-12">
              {children}
            </main>
          </div>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
