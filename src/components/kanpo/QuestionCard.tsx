"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Question } from "@/lib/kanpo/types";

interface QuestionCardProps {
  questionNumber: number;
  question: Question;
  disabled?: boolean;
  loadingLabel?: string;
  onSelect: (selectedOption: number, rawMessage: string) => void;
}

export function QuestionCard({
  questionNumber,
  question,
  disabled = false,
  loadingLabel,
  onSelect,
}: QuestionCardProps) {
  return (
    <Card className="gap-4">
      <CardHeader className="gap-1">
        <CardDescription>質問 {questionNumber}</CardDescription>
        <CardTitle className="text-lg leading-relaxed">{question.text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {question.options.map((option) => (
          <Button
            key={`${question.id}-${option.value}`}
            type="button"
            variant="outline"
            className="h-auto w-full justify-start whitespace-normal px-4 py-3 text-left"
            onClick={() => onSelect(option.value, option.label)}
            disabled={disabled}
          >
            {option.label}
          </Button>
        ))}

        {disabled && loadingLabel ? (
          <p className="text-sm text-muted-foreground">{loadingLabel}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
