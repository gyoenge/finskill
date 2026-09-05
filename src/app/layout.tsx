import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { BottomNav, SideNav } from "@/components/Nav";
import { Wordmark } from "@/components/Brand";
import { StoreProvider } from "@/components/StoreProvider";
import { TimelineProvider } from "@/components/timeline/TimelineStore";

export const metadata: Metadata = {
  title: "20FIN — 20대의 다음을 준비하는 AI 금융 Agent",
  description:
    "20대의 Life Event를 시간축으로 이해하고, 각 시점에 필요한 금융정보와 행동을 필요한 순간에 제안하는 Timeline-aware AI 금융 Agent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans antialiased">
        {/* StoreProvider(FinSkill)는 마이그레이션 중 구 페이지를 위해 유지한다. */}
        <StoreProvider>
          <TimelineProvider>
            <div className="flex min-h-screen">
              <SideNav />
              <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
                  <Link href="/">
                    <Wordmark size={20} />
                  </Link>
                  <Link href="/ask" className="text-[12px] font-semibold text-fin-green-700">
                    피오에게 물어보기
                  </Link>
                </header>
                <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-14">
                  {children}
                </main>
              </div>
            </div>
            <BottomNav />
          </TimelineProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
