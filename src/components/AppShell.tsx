"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Wordmark } from "@/components/Brand";
import { BottomNav, SideNav } from "@/components/Nav";
import { TimelineLoading, useTimeline } from "@/components/timeline/TimelineStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, ready } = useTimeline();
  const onboarding = pathname === "/onboarding";
  const needsOnboarding = ready && (!state.user || state.isDemo === true);

  useEffect(() => {
    if (needsOnboarding && !onboarding) router.replace("/onboarding");
  }, [needsOnboarding, onboarding, router]);

  if (!ready || (needsOnboarding && !onboarding)) {
    return <main id="main-content" className="app-content"><TimelineLoading /></main>;
  }

  if (onboarding) {
    return <main id="main-content" className="onboarding-route">{children}</main>;
  }

  return <div className="app-shell"><SideNav /><div className="app-body"><header className="mobile-header"><Link href="/" aria-label="20FIN 홈"><Wordmark size={28} /></Link><Link href="/ask">피오에게 물어보기 ↗</Link></header><main id="main-content" className="app-content">{children}</main></div><BottomNav /></div>;
}
