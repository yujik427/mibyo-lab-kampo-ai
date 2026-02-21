"use client";

import { ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AVATAR_SRC, AVATAR_ALT } from "@/lib/constants";
import { useState } from "react";

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onReset?: () => void;
}

export function ChatHeader({ title, subtitle, onBack, onReset }: ChatHeaderProps) {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3">
      {onBack && (
        <Button variant="ghost" size="icon" className="-ml-2" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {avatarError ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg">
          🌿
        </div>
      ) : (
        <img
          src={AVATAR_SRC}
          alt={AVATAR_ALT}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          onError={() => setAvatarError(true)}
        />
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      {onReset && (
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2"
          onClick={() => {
            if (confirm("会話履歴をリセットしますか？")) onReset();
          }}
          title="リセット"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </header>
  );
}
