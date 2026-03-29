"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuestionCardProps {
  questionNumber?: number;
  questionLabel?: string;
  questionText: string;
  options: readonly string[];
  disabled?: boolean;
  loadingLabel?: string;
  onSubmit: (selectedOption: number, selectedLabel: string, optionalNote: string) => void;
}

export function QuestionCard({
  questionNumber,
  questionLabel,
  questionText,
  options,
  disabled = false,
  loadingLabel,
  onSubmit,
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    setSelectedOption(null);
  }, [questionNumber, questionText]);

  return (
    <Card className="gap-4">
      <CardHeader className="gap-1">
        <CardDescription>
          {questionLabel || (typeof questionNumber === "number" ? `質問 ${questionNumber}` : "質問")}
        </CardDescription>
        <CardTitle className="text-lg leading-relaxed">{questionText}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2">
          {options.map((option, index) => (
            <Button
              key={`${questionNumber}-${index}-${option}`}
              type="button"
              variant={selectedOption === index ? "default" : "outline"}
              className="h-auto w-full justify-start whitespace-normal px-4 py-3 text-left"
              onClick={() => {
                if (disabled || selectedOption !== null) return;
                setSelectedOption(index);
                onSubmit(index, options[index] ?? `${index}`, "");
              }}
              disabled={disabled || selectedOption !== null}
            >
              {option}
            </Button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          各質問は選択肢を押すと、そのまま次へ進みます。
        </p>

        {disabled && loadingLabel ? (
          <p className="text-sm text-muted-foreground">{loadingLabel}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
