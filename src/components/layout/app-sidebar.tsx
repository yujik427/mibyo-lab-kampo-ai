"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, ClipboardCheck, MessageCircle, FileText, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "ダッシュボード" },
  { href: "/chat/free", icon: MessageCircle, label: "体質分析" },
  { href: "/chat/diagnosis", icon: ClipboardCheck, label: "スピード分析" },
  { href: "/report", icon: FileText, label: "レポート" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-border lg:bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <Leaf className="h-6 w-6 text-primary" />
        <span className="text-base font-bold text-sidebar-foreground">漢方セルフケアAI</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-xs text-sidebar-foreground/50">
          ※ 医療行為の断定ではありません
        </p>
      </div>
    </aside>
  );
}
