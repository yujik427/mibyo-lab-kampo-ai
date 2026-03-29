"use client";

import { ConstitutionAvatar } from "@/components/ConstitutionAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BodyFigureValues, BodyLabels } from "@/lib/kanpo/types";

interface BodyTypeFigureProps {
  values: BodyFigureValues;
  labels: BodyLabels;
  confirmedCount: number;
  totalSlots: number;
  visualOpacity: number;
}

function formatBodyLabel(label: string, confirmedCount: number, totalSlots: number) {
  if (confirmedCount === 0) return "未判定";
  if (confirmedCount < Math.ceil(totalSlots * 0.4)) return `${label}（暫定）`;
  return label;
}

export function BodyTypeFigure({
  values,
  labels,
  confirmedCount,
  totalSlots,
  visualOpacity,
}: BodyTypeFigureProps) {
  const isProvisional = confirmedCount < Math.ceil(totalSlots * 0.4);

  return (
    <Card className="gap-4">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">体質イメージ</CardTitle>
          {isProvisional ? (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              暫定表示
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="flex justify-center" style={{ opacity: visualOpacity }}>
          <ConstitutionAvatar
            kyojitsu={values.kyojitsu}
            upperTemp={values.upperTemp}
            lowerTemp={values.lowerTemp}
            soshitsu={values.soshitsu}
            upperTextureScore={values.upperTextureScore}
            lowerTextureScore={values.lowerTextureScore}
            size={220}
          />
        </div>

        <div className="grid flex-1 gap-3 text-sm leading-relaxed">
          <p className="text-xs text-muted-foreground">
            確定情報 {confirmedCount} / {totalSlots}
            {isProvisional ? " のため、見た目は参考表示です。" : " を反映しています。"}
          </p>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">虚実</p>
          <p className="mt-1 font-medium">
            {formatBodyLabel(labels.kyojitsu, confirmedCount, totalSlots)}
          </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">寒熱</p>
            <p className="mt-1 font-medium">
            上半身: {formatBodyLabel(labels.upperTemperature, confirmedCount, totalSlots)}
              <br />
            下半身: {formatBodyLabel(labels.lowerTemperature, confirmedCount, totalSlots)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">燥湿</p>
            <p className="mt-1 font-medium">
            上半身: {formatBodyLabel(labels.upperTexture, confirmedCount, totalSlots)}
              <br />
            下半身: {formatBodyLabel(labels.lowerTexture, confirmedCount, totalSlots)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
