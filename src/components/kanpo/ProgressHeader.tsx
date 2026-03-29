"use client";

import { Button } from "@/components/ui/button";
import type { QuestionProgress } from "@/lib/kanpo/types";

interface ProgressHeaderProps {
  progress: QuestionProgress;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function ProgressHeader({ progress, onReset, onUndo, canUndo }: ProgressHeaderProps) {
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            AI直結版 漢方チャット
          </p>
          <h1 className="text-xl font-semibold text-foreground">20問で体質傾向を整理</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            進行管理と採点はアプリ側で固定し、AIはフィードバックと最終レポートだけを担当します。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
            1つ前に戻る
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            最初からやり直す
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {Math.min(progress.current, progress.total)} / {progress.total}
          </span>
          <span className="text-muted-foreground">直近2週間</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
