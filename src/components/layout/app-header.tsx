"use client";

import { Menu, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function AppHeader({ title, onMenuClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3 lg:hidden">
      {onMenuClick && (
        <Button variant="ghost" size="icon" className="-ml-2" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <div className="flex items-center gap-2">
        <Leaf className="h-5 w-5 text-primary" />
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      </div>
    </header>
  );
}
