"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { MobileDrawer } from "./mobile-drawer";

const PAGE_TITLES: Record<string, string> = {
  "/": "ダッシュボード",
  "/chat/free": "体質分析",
  "/chat/diagnosis": "スピード分析",
  "/report": "レポート",
};

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const isChatPage = pathname.startsWith("/chat/");
  const isReportDetail = pathname.startsWith("/report/") && pathname !== "/report";

  const title = PAGE_TITLES[pathname] || "漢方セルフケアAI";
  const showMobileHeader = !isChatPage && !isReportDetail;

  return (
    <div className="flex h-dvh">
      <AppSidebar />
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {showMobileHeader && (
          <AppHeader title={title} onMenuClick={() => setDrawerOpen(true)} />
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
