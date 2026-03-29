"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BodyLabels, MainScores } from "@/lib/kanpo/types";

interface ResultSummaryProps {
  bodyLabels: BodyLabels;
  mainScores: MainScores;
  confirmedCount: number;
  totalSlots: number;
}

function formatLabel(label: string, confirmedCount: number, totalSlots: number) {
  if (confirmedCount === 0) return "未判定";
  if (confirmedCount < Math.ceil(totalSlots * 0.4)) return `${label}（暫定）`;
  return label;
}

export function ResultSummary({
  bodyLabels,
  mainScores,
  confirmedCount,
  totalSlots,
}: ResultSummaryProps) {
  const topPatterns = Object.entries(mainScores)
    .sort((left, right) => right[1].percent - left[1].percent)
    .slice(0, 3);
  const isProvisional = confirmedCount < Math.ceil(totalSlots * 0.4);

  return (
    <Card className="gap-4">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">結果要約</CardTitle>
          {isProvisional ? (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              暫定表示
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          確定情報 {confirmedCount} / {totalSlots}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">虚実</p>
            <p className="mt-1 text-sm font-medium">
              {formatLabel(bodyLabels.kyojitsu, confirmedCount, totalSlots)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">寒熱</p>
            <p className="mt-1 text-sm font-medium">
              上 {formatLabel(bodyLabels.upperTemperature, confirmedCount, totalSlots)}
              <br />
              下 {formatLabel(bodyLabels.lowerTemperature, confirmedCount, totalSlots)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">燥湿</p>
            <p className="mt-1 text-sm font-medium">
              上 {formatLabel(bodyLabels.upperTexture, confirmedCount, totalSlots)}
              <br />
              下 {formatLabel(bodyLabels.lowerTexture, confirmedCount, totalSlots)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">強めに出た気血水パターン</p>
          {confirmedCount < 3 ? (
            <p className="text-sm text-muted-foreground">
              まだ確定情報が少ないため、気血水パターンはもう少し問診が進むと見えやすくなります。
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topPatterns.map(([label, detail]) => (
                <span
                  key={label}
                  className="rounded-full border border-border/70 px-3 py-1 text-xs text-foreground"
                >
                  {label} {detail.percent.toFixed(0)}点{isProvisional ? "（参考）" : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
