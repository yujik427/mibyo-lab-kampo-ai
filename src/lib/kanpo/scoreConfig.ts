import type { MainScoreName, QuestionId } from "./types";

export type WeightedQuestionId = QuestionId | readonly [QuestionId, number];

export const MAIN_SCORE_ORDER: readonly MainScoreName[] = [
  "気滞",
  "気逆",
  "気虚",
  "血虚",
  "瘀血",
  "水滞",
  "津液不足",
] as const;

export const MAIN_SCORE_MAX_RAW: Record<MainScoreName, number> = {
  気滞: 16,
  気逆: 16,
  気虚: 12,
  血虚: 14,
  瘀血: 8,
  水滞: 16,
  津液不足: 18,
};

export const MAIN_SCORE_WEIGHTS: Record<
  QuestionId,
  Partial<Record<MainScoreName, number>>
> = {
  Q01: { 気虚: 1.0 },
  Q02: { 気虚: 1.0 },
  Q03: { 気滞: 1.0 },
  Q04: { 気滞: 1.0, 気逆: 0.5 },
  Q05: { 気逆: 1.0 },
  Q06: { 気逆: 1.0, 気滞: 0.5 },
  Q07: { 血虚: 1.0 },
  Q08: { 血虚: 1.0, 津液不足: 0.5 },
  Q09: { 瘀血: 1.0, 気滞: 0.5 },
  Q10: { 瘀血: 1.0, 血虚: 0.5 },
  Q11: { 水滞: 1.0 },
  Q12: { 水滞: 1.0 },
  Q13: { 津液不足: 1.0 },
  Q14: { 津液不足: 1.0, 血虚: 0.5 },
  Q15: { 気虚: 1.0, 水滞: 0.5 },
  Q16: { 気滞: 1.0, 気逆: 0.5 },
  Q17: { 水滞: 1.0 },
  Q18: { 津液不足: 1.0 },
  Q19: { 気逆: 1.0, 水滞: 0.5 },
  Q20: { 津液不足: 1.0, 血虚: 0.5 },
};

export const BODY_SCORE_CONFIG = {
  deficiencySignals: [
    ["Q01", 1],
    ["Q02", 1],
    ["Q07", 0.8],
    ["Q08", 0.8],
    ["Q15", 1],
    ["Q20", 0.8],
  ] as const satisfies readonly WeightedQuestionId[],
  accumulationSignals: [
    ["Q09", 1],
    ["Q10", 0.9],
    ["Q11", 1],
    ["Q12", 1],
    ["Q17", 0.8],
    ["Q19", 0.7],
  ] as const satisfies readonly WeightedQuestionId[],
  upperHeatSignals: [
    ["Q03", 0.8],
    ["Q04", 1],
    ["Q05", 1],
    ["Q06", 1],
    ["Q13", 0.7],
    ["Q14", 0.6],
    ["Q16", 1],
  ] as const satisfies readonly WeightedQuestionId[],
  upperColdSignals: [
    ["Q01", 1],
    ["Q02", 1],
    ["Q07", 0.6],
    ["Q08", 0.6],
    ["Q20", 0.6],
  ] as const satisfies readonly WeightedQuestionId[],
  lowerHeatSignals: [
    ["Q09", 1],
    ["Q10", 0.9],
    ["Q18", 0.8],
  ] as const satisfies readonly WeightedQuestionId[],
  lowerColdSignals: [
    ["Q11", 1],
    ["Q12", 1],
    ["Q15", 0.9],
    ["Q17", 1],
    ["Q19", 0.8],
  ] as const satisfies readonly WeightedQuestionId[],
  dry: ["Q13", "Q14", "Q18", "Q20"] as const satisfies readonly WeightedQuestionId[],
  damp: ["Q11", "Q12", "Q17", "Q19"] as const satisfies readonly WeightedQuestionId[],
  upperDamp: [
    "Q12",
    "Q19",
    ["Q11", 0.5],
    ["Q17", 0.5],
  ] as const satisfies readonly WeightedQuestionId[],
  lowerDamp: [
    "Q11",
    ["Q12", 0.5],
    ["Q17", 0.5],
    ["Q19", 0.5],
  ] as const satisfies readonly WeightedQuestionId[],
  upperDry: [
    "Q13",
    "Q20",
    ["Q14", 0.5],
    ["Q18", 0.5],
  ] as const satisfies readonly WeightedQuestionId[],
  lowerDry: [
    "Q14",
    ["Q13", 0.5],
    ["Q18", 0.5],
    ["Q20", 0.5],
  ] as const satisfies readonly WeightedQuestionId[],
};

export const BODY_SCORE_MAX = {
  dry: 16,
  damp: 16,
  upperDamp: 12,
  lowerDamp: 10,
  upperDry: 12,
  lowerDry: 10,
} as const;

export const BODY_TENDENCY_THRESHOLDS = {
  upperDamp: { global: 45, local: 60 },
  lowerDamp: { global: 45, local: 65, minimumQuestion: "Q11", minimumValue: 2 },
  upperDry: { global: 45, local: 60 },
  lowerDry: { global: 45, local: 65, minimumQuestion: "Q14", minimumValue: 2 },
} as const;
