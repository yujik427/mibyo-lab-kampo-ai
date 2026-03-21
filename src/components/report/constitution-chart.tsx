"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConstitutionChartProps {
  answers?: Record<string, string>;
  embedded?: boolean;
  placeholder?: boolean;
}

interface DimensionScore {
  dimension: ParameterName;
  score: number;
  fullMark: number;
}

type ParameterName = "気滞" | "気逆" | "気虚" | "血虚" | "瘀血" | "水滞" | "津液不足";

const PARAMETER_ORDER: ParameterName[] = [
  "気滞",
  "気逆",
  "気虚",
  "血虚",
  "瘀血",
  "水滞",
  "津液不足",
];

const FREQUENCY_ANSWER_SCORE_MAP: Record<string, number> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "0: まったくない": 0,
  "1: ほとんどない": 1,
  "2: ときどきある": 2,
  "3: よくある": 3,
  "4: ほぼ毎日ある": 4,
  まったくない: 0,
  ほとんどない: 1,
  ときどきある: 2,
  よくある: 3,
  ほぼ毎日ある: 4,
};

const PARAMETER_MAX_RAW_SCORES: Record<ParameterName, number> = {
  気滞: 16,
  気逆: 16,
  気虚: 12,
  血虚: 14,
  瘀血: 8,
  水滞: 16,
  津液不足: 18,
};

const QUESTION_PARAMETER_WEIGHTS: Record<string, Partial<Record<ParameterName, number>>> = {
  q1: { 気虚: 1.0 },
  q2: { 気虚: 1.0 },
  q3: { 気滞: 1.0 },
  q4: { 気滞: 1.0, 気逆: 0.5 },
  q5: { 気逆: 1.0 },
  q6: { 気逆: 1.0, 気滞: 0.5 },
  q7: { 血虚: 1.0 },
  q8: { 血虚: 1.0, 津液不足: 0.5 },
  q9: { 瘀血: 1.0, 気滞: 0.5 },
  q10: { 瘀血: 1.0, 血虚: 0.5 },
  q11: { 水滞: 1.0 },
  q12: { 水滞: 1.0 },
  q13: { 津液不足: 1.0 },
  q14: { 津液不足: 1.0, 血虚: 0.5 },
  q15: { 気虚: 1.0, 水滞: 0.5 },
  q16: { 気滞: 1.0, 気逆: 0.5 },
  q17: { 水滞: 1.0 },
  q18: { 津液不足: 1.0 },
  q19: { 気逆: 1.0, 水滞: 0.5 },
  q20: { 津液不足: 1.0, 血虚: 0.5 },
};

const LEGACY_PARAMETER_DEFINITIONS: {
  name: ParameterName;
  scoreMap: Record<string, Record<string, number>>;
}[] = [
  {
    name: "気滞",
    scoreMap: {
      q5: { 食欲が不安定: 2, 食欲がない: 1, 普通: 0, 食欲旺盛: 0 },
      q8: { よく感じる: 4, たまに感じる: 2, あまり感じない: 1, ほとんど感じない: 0 },
      q9: { ひどい: 4, ある: 3, たまにある: 1, ない: 0 },
      q14: { 不規則: 2, 痛みがある: 2, 量が多い: 1, 規則正しい: 0 },
      q17: { よくイライラする: 4, たまにイライラする: 2, あまりイライラしない: 1, ほとんどイライラしない: 0 },
    },
  },
  {
    name: "気逆",
    scoreMap: {
      q3: { よくある: 4, たまにある: 2, ほとんどない: 1, 全くない: 0 },
      q5: { 食欲が不安定: 3, 食欲がない: 2, 普通: 0, 食欲旺盛: 0 },
      q8: { よく感じる: 2, たまに感じる: 1, あまり感じない: 0, ほとんど感じない: 0 },
      q10: { よくある: 2, たまにある: 1, ほとんどない: 0, 全くない: 0 },
      q17: { よくイライラする: 3, たまにイライラする: 1, あまりイライラしない: 0, ほとんどイライラしない: 0 },
    },
  },
  {
    name: "気虚",
    scoreMap: {
      q1: { 体が弱い: 4, 疲れやすい: 3, 普通: 1, 元気で調子が良い: 0 },
      q4: { よく汗をかく: 2, 普通: 0, あまり汗をかかない: 0, ほとんど汗をかかない: 0 },
      q5: { 食欲がない: 4, 食欲が不安定: 3, 普通: 1, 食欲旺盛: 0 },
      q18: { とても疲れやすい: 4, 疲れやすい: 3, 少し疲れやすい: 2, 疲れにくい: 0 },
      q19: { 全くしない: 3, ほとんどしない: 2, たまにする: 1, よくする: 0 },
      q20: { 不規則: 2, 偏りがある: 1, 普通: 0, バランスが良い: 0 },
    },
  },
  {
    name: "血虚",
    scoreMap: {
      q1: { 体が弱い: 2, 疲れやすい: 1, 普通: 0, 元気で調子が良い: 0 },
      q7: { 不眠気味: 3, 眠りが浅い: 2, 普通: 1, よく眠れる: 0 },
      q11: { よくある: 4, たまにある: 2, ほとんどない: 1, 全くない: 0 },
      q13: { 乾燥気味: 3, 荒れている: 2, きれい: 0, 脂っぽい: 0 },
      q18: { とても疲れやすい: 2, 疲れやすい: 1, 少し疲れやすい: 1, 疲れにくい: 0 },
    },
  },
  {
    name: "瘀血",
    scoreMap: {
      q9: { ひどい: 4, ある: 3, たまにある: 1, ない: 0 },
      q10: { よくある: 4, たまにある: 2, ほとんどない: 1, 全くない: 0 },
      q14: { 痛みがある: 4, 量が多い: 3, 不規則: 2, 規則正しい: 0 },
      q17: { よくイライラする: 2, たまにイライラする: 1, あまりイライラしない: 0, ほとんどイライラしない: 0 },
    },
  },
  {
    name: "水滞",
    scoreMap: {
      q2: { かなり冷える: 2, 少し冷える: 1, たまに冷える: 1, 冷えは感じない: 0 },
      q5: { 食欲がない: 2, 食欲が不安定: 1, 普通: 0, 食欲旺盛: 0 },
      q6: { 下痢気味: 3, 不規則: 2, 便秘気味: 1, 毎日規則正しい: 0 },
      q11: { よくある: 2, たまにある: 1, ほとんどない: 0, 全くない: 0 },
      q12: { よくある: 4, たまにある: 2, ほとんどない: 1, 全くない: 0 },
      q13: { 脂っぽい: 2, 荒れている: 1, きれい: 0, 乾燥気味: 0 },
    },
  },
  {
    name: "津液不足",
    scoreMap: {
      q4: { ほとんど汗をかかない: 3, あまり汗をかかない: 2, 普通: 0, よく汗をかく: 0 },
      q6: { 便秘気味: 3, 不規則: 1, 下痢気味: 0, 毎日規則正しい: 0 },
      q13: { 乾燥気味: 4, 荒れている: 2, きれい: 0, 脂っぽい: 0 },
      q15: { よく感じる: 4, たまに感じる: 2, ほとんど感じない: 1, 全く感じない: 0 },
      q16: { よく感じる: 4, たまに感じる: 2, ほとんど感じない: 1, 全く感じない: 0 },
    },
  },
];

function clampPercent(score: number) {
  return Math.max(0, Math.min(100, score));
}

function percentToLevel(score: number) {
  if (score <= 9) return 0;
  if (score <= 29) return 1;
  if (score <= 49) return 2;
  if (score <= 69) return 3;
  if (score <= 84) return 4;
  return 5;
}

function getFrequencyAnswerScore(answer: string | undefined) {
  if (!answer) return null;

  const mappedScore = FREQUENCY_ANSWER_SCORE_MAP[answer];
  if (mappedScore !== undefined) return mappedScore;

  const matched = answer.match(/^([0-4])(?:\s*[：:]\s*.*)?$/);
  return matched ? Number(matched[1]) : null;
}

function isFrequencyAnswerSet(answers: Record<string, string>) {
  const values = Object.values(answers);
  return values.length > 0 && values.every((answer) => getFrequencyAnswerScore(answer) !== null);
}

function getOketsuConfidenceFactor(q9Score: number, q10Score: number) {
  if (q9Score >= 3 && q10Score >= 3) return 1.0;
  if (q9Score >= 2 && q10Score >= 2) return 0.9;
  if ((q9Score >= 3 && q10Score <= 1) || (q10Score >= 3 && q9Score <= 1)) return 0.6;
  if ((q9Score >= 2 && q10Score === 0) || (q10Score >= 2 && q9Score === 0)) return 0.5;
  if (q9Score <= 1 && q10Score <= 1) return 0.4;
  return 0.75;
}

function computeFrequencyScores(answers: Record<string, string>): DimensionScore[] {
  const oketsuConfidenceFactor = getOketsuConfidenceFactor(
    getFrequencyAnswerScore(answers.q9) ?? 0,
    getFrequencyAnswerScore(answers.q10) ?? 0,
  );

  return PARAMETER_ORDER.map((parameter) => {
    let rawScore = 0;

    for (const [questionId, weights] of Object.entries(QUESTION_PARAMETER_WEIGHTS)) {
      const answerScore = getFrequencyAnswerScore(answers[questionId]) ?? 0;
      rawScore += answerScore * (weights[parameter] ?? 0);
    }

    const maxScore = PARAMETER_MAX_RAW_SCORES[parameter];
    const baseScore = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;
    // 瘀血は主設問が少ないため、2問のそろい方で信頼度を補正する。
    const finalScore =
      parameter === "瘀血" ? baseScore * oketsuConfidenceFactor : baseScore;

    return {
      dimension: parameter,
      score: percentToLevel(clampPercent(finalScore)),
      fullMark: 5,
    };
  });
}

function computeLegacyScores(answers: Record<string, string>): DimensionScore[] {
  return LEGACY_PARAMETER_DEFINITIONS.map((parameter) => {
    let total = 0;
    let count = 0;

    for (const [questionId, scoreMap] of Object.entries(parameter.scoreMap)) {
      const answer = answers[questionId];
      if (!answer || scoreMap[answer] === undefined) continue;

      total += scoreMap[answer];
      count += 1;
    }

    const average = count > 0 ? total / count : 0;

    return {
      dimension: parameter.name,
      score: percentToLevel(clampPercent((average / 4) * 100)),
      fullMark: 5,
    };
  });
}

function computeScores(answers: Record<string, string>) {
  return isFrequencyAnswerSet(answers)
    ? computeFrequencyScores(answers)
    : computeLegacyScores(answers);
}

export function ConstitutionChart({
  answers,
  embedded = false,
  placeholder = false,
}: ConstitutionChartProps) {
  const isPlaceholder = placeholder || !answers;
  const data = isPlaceholder
    ? PARAMETER_ORDER.map((parameter) => ({
        dimension: parameter,
        score: 0,
        fullMark: 5,
      }))
    : computeScores(answers);

  const chart = (
    <>
      <div
        className={
          embedded
            ? "mx-auto aspect-square w-full max-w-[208px] sm:max-w-[216px] lg:max-w-[228px]"
            : "mx-auto aspect-square max-w-[380px]"
        }
      >
        <div className="relative h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius={embedded ? "72%" : "68%"} data={data}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: "var(--muted-foreground)", fontSize: embedded ? 7 : 11 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} axisLine={false} />
              {!isPlaceholder ? (
                <Radar
                  name="体質"
                  dataKey="score"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              ) : null}
            </RadarChart>
          </ResponsiveContainer>
          {isPlaceholder ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="rounded-full border border-border/60 bg-background/90 px-2 py-1 text-[9px] text-muted-foreground">
                AI算出予定
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <p
        className={`mx-auto mt-1 max-w-[188px] text-center text-muted-foreground ${embedded ? "text-[9px]" : "text-xs"}`}
      >
        {isPlaceholder
          ? "AIが算出した気血水スコアをここに反映予定です"
          : "外側に広がるほど、その傾向が強い状態を表します"}
      </p>
    </>
  );

  if (embedded) {
    return <div className="w-full">{chart}</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">気血水パラメータ</CardTitle>
      </CardHeader>
      <CardContent>{chart}</CardContent>
    </Card>
  );
}
