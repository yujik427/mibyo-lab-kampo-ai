"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DIAGNOSIS_ANSWER_PERIOD_LABEL } from "@/lib/constants";
import type { DiagnosisQuestion } from "@/lib/types";

interface DiagnosisOptionsProps {
  question: DiagnosisQuestion;
  progress: { current: number; total: number };
  onSelect: (questionId: string, value: string, label: string) => void;
}

export function DiagnosisOptions({ question, progress, onSelect }: DiagnosisOptionsProps) {
  const pct = (progress.current / progress.total) * 100;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>質問 {progress.current} / {progress.total}</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
        <p className="text-[11px] text-muted-foreground">
          {DIAGNOSIS_ANSWER_PERIOD_LABEL}の状態を思い出して選んでください
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {question.options.map((opt, idx) => (
          <Button
            key={opt.value}
            variant="outline"
            className="justify-start text-left h-auto py-3 px-4 text-sm font-normal hover:bg-accent animate-in fade-in slide-in-from-left-1 duration-200"
            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "both" }}
            onClick={() => onSelect(question.id, opt.value, opt.label)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
