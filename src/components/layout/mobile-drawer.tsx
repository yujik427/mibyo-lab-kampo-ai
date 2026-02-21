"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, ClipboardCheck, MessageCircle, FileText, Home } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "ダッシュボード" },
  { href: "/chat/free", icon: MessageCircle, label: "体質分析" },
  { href: "/chat/diagnosis", icon: ClipboardCheck, label: "スピード分析" },
  { href: "/report", icon: FileText, label: "レポート" },
];

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b border-border px-5 py-5">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Leaf className="h-5 w-5 text-primary" />
            漢方セルフケアAI
          </SheetTitle>
          <SheetDescription className="sr-only">
            ナビゲーションメニュー
          </SheetDescription>
        </SheetHeader>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/70 hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground/50">
            ※ 医療行為の断定ではありません
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
