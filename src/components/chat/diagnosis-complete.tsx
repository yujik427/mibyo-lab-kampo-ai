"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface DiagnosisCompleteProps {
  onGenerateResult: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
  buttonLabel?: string;
  loadingLabel?: string;
}

export function DiagnosisComplete({
  onGenerateResult,
  loading,
  title = "全20問への回答が完了しました",
  description = "AIが体質を分析し、漢方的なセルフケアの方向性を提案します",
  buttonLabel = "診断結果を生成する",
  loadingLabel = "分析中…",
}: DiagnosisCompleteProps) {
  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Button
        onClick={onGenerateResult}
        disabled={loading}
        className="w-full gap-2"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {buttonLabel}
          </>
        )}
      </Button>
    </div>
  );
}
