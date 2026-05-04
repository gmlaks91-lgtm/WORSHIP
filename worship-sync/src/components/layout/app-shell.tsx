import type { ReactNode } from "react";

import { AppBottomNav } from "@/components/layout/app-bottom-nav";
import { AppHeader } from "@/components/layout/app-header";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * 모바일·태블릿 사용을 전제로 한 앱 셸: 상단 헤더 + 하단 내비 + 하단 패딩.
 */
export async function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn("flex min-h-full flex-1 flex-col bg-background", className)}>
      <AppHeader />
      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-28 pt-7 sm:px-6 sm:pb-32 sm:pt-8">
        {children}
      </main>
      <AppBottomNav />
    </div>
  );
}
