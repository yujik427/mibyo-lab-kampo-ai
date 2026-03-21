"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BodyLabels, MainScores } from "@/lib/kanpo/types";

interface ResultSummaryProps {
  bodyLabels: BodyLabels;
  mainScores: MainScores;
}

export function ResultSummary({ bodyLabels, mainScores }: ResultSummaryProps) {
  const topPatterns = Object.entries(mainScores)
    .sort((left, right) => right[1].percent - left[1].percent)
    .slice(0, 3);

  return (
    <Card className="gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">結果要約</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">虚実</p>
            <p className="mt-1 text-sm font-medium">{bodyLabels.kyojitsu}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">寒熱</p>
            <p className="mt-1 text-sm font-medium">
              上 {bodyLabels.upperTemperature}
              <br />
              下 {bodyLabels.lowerTemperature}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">燥湿</p>
            <p className="mt-1 text-sm font-medium">
              上 {bodyLabels.upperTexture}
              <br />
              下 {bodyLabels.lowerTexture}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">強めに出た気血水パターン</p>
          <div className="flex flex-wrap gap-2">
            {topPatterns.map(([label, detail]) => (
              <span
                key={label}
                className="rounded-full border border-border/70 px-3 py-1 text-xs text-foreground"
              >
                {label} {detail.percent.toFixed(0)}点
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
