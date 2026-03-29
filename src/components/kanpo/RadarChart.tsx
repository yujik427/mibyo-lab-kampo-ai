"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MainScores } from "@/lib/kanpo/types";

interface RadarChartProps {
  mainScores: MainScores;
  confirmedCount: number;
  totalSlots: number;
  visualOpacity: number;
}

export function RadarChart({
  mainScores,
  confirmedCount,
  totalSlots,
  visualOpacity,
}: RadarChartProps) {
  const data = Object.entries(mainScores).map(([label, detail]) => ({
    label,
    score: detail.level,
    fullMark: 5,
  }));
  const isProvisional = confirmedCount < Math.ceil(totalSlots * 0.4);
  const shouldRenderRadar = confirmedCount > 0;

  return (
    <Card className="gap-4">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">気血水パラメータ</CardTitle>
          {isProvisional ? (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              暫定表示
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="h-[280px]">
        <p className="mb-2 text-xs text-muted-foreground">
          確定情報 {confirmedCount} / {totalSlots}
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart data={data} outerRadius="68%">
            <PolarGrid stroke="rgba(148, 163, 184, 0.35)" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: "currentColor", fontSize: 12 }}
              className="text-muted-foreground"
            />
            <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
            {shouldRenderRadar ? (
              <Radar
                dataKey="score"
                stroke="#7C3AED"
                fill="#A78BFA"
                fillOpacity={0.12 + visualOpacity * 0.28}
                strokeWidth={2}
                strokeOpacity={Math.max(0.35, visualOpacity)}
              />
            ) : null}
          </RechartsRadarChart>
        </ResponsiveContainer>
        {confirmedCount === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            問診が進むと、ここに気血水パラメータが反映されます。
          </p>
        ) : isProvisional ? (
          <p className="mt-2 text-sm text-muted-foreground">
            まだ確定情報が少ないため、レーダーは参考表示です。
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
