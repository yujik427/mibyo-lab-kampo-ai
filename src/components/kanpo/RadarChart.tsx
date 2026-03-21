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
}

export function RadarChart({ mainScores }: RadarChartProps) {
  const data = Object.entries(mainScores).map(([label, detail]) => ({
    label,
    score: detail.level,
    fullMark: 5,
  }));

  return (
    <Card className="gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">気血水パラメータ</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart data={data} outerRadius="68%">
            <PolarGrid stroke="rgba(148, 163, 184, 0.35)" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: "currentColor", fontSize: 12 }}
              className="text-muted-foreground"
            />
            <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
            <Radar
              dataKey="score"
              stroke="#7C3AED"
              fill="#A78BFA"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
