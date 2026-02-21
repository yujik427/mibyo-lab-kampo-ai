"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConstitutionChartProps {
  answers: Record<string, string>;
}

interface DimensionScore {
  dimension: string;
  score: number;
  fullMark: number;
}

const QUESTION_SCORES: Record<string, Record<string, number>> = {
  q1: { "元気で調子が良い": 4, "普通": 3, "疲れやすい": 2, "体が弱い": 1 },
  q2: { "冷えは感じない": 4, "たまに冷える": 3, "少し冷える": 2, "かなり冷える": 1 },
  q3: { "全くない": 4, "ほとんどない": 3, "たまにある": 2, "よくある": 1 },
  q4: { "普通": 3, "よく汗をかく": 2, "あまり汗をかかない": 2, "ほとんど汗をかかない": 1 },
  q5: { "食欲旺盛": 4, "普通": 3, "食欲がない": 2, "食欲が不安定": 1 },
  q6: { "毎日規則正しい": 4, "便秘気味": 2, "下痢気味": 2, "不規則": 1 },
  q7: { "よく眠れる": 4, "普通": 3, "眠りが浅い": 2, "不眠気味": 1 },
  q8: { "ほとんど感じない": 4, "あまり感じない": 3, "たまに感じる": 2, "よく感じる": 1 },
  q9: { "ない": 4, "たまにある": 3, "ある": 2, "ひどい": 1 },
  q10: { "全くない": 4, "ほとんどない": 3, "たまにある": 2, "よくある": 1 },
  q11: { "全くない": 4, "ほとんどない": 3, "たまにある": 2, "よくある": 1 },
  q12: { "全くない": 4, "ほとんどない": 3, "たまにある": 2, "よくある": 1 },
  q15: { "全く感じない": 4, "ほとんど感じない": 3, "たまに感じる": 2, "よく感じる": 1 },
  q16: { "全く感じない": 4, "ほとんど感じない": 3, "たまに感じる": 2, "よく感じる": 1 },
  q17: { "ほとんどイライラしない": 4, "あまりイライラしない": 3, "たまにイライラする": 2, "よくイライラする": 1 },
  q18: { "疲れにくい": 4, "少し疲れやすい": 3, "疲れやすい": 2, "とても疲れやすい": 1 },
  q19: { "よくする": 4, "たまにする": 3, "ほとんどしない": 2, "全くしない": 1 },
  q20: { "バランスが良い": 4, "普通": 3, "偏りがある": 2, "不規則": 1 },
};

const DIMENSIONS: { name: string; questions: string[] }[] = [
  { name: "エネルギー（気）", questions: ["q1", "q18", "q19"] },
  { name: "冷え・温", questions: ["q2", "q3", "q4"] },
  { name: "消化・食", questions: ["q5", "q6", "q20"] },
  { name: "精神・睡眠", questions: ["q7", "q8", "q17"] },
  { name: "血行・巡り", questions: ["q9", "q10", "q11"] },
  { name: "水分バランス", questions: ["q12", "q15", "q16"] },
];

function computeScores(answers: Record<string, string>): DimensionScore[] {
  return DIMENSIONS.map((dim) => {
    let total = 0;
    let count = 0;
    for (const qId of dim.questions) {
      const answer = answers[qId];
      const scoreMap = QUESTION_SCORES[qId];
      if (answer && scoreMap && scoreMap[answer] !== undefined) {
        total += scoreMap[answer];
        count++;
      }
    }
    const avg = count > 0 ? total / count : 2.5;
    return { dimension: dim.name, score: Math.round(avg * 25), fullMark: 100 };
  });
}

export function ConstitutionChart({ answers }: ConstitutionChartProps) {
  const data = computeScores(answers);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">体質バランス</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mx-auto max-w-[320px] aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="体質"
                dataKey="score"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          各軸のスコアが高いほど良好な状態を表します
        </p>
      </CardContent>
    </Card>
  );
}
