import {
  BODY_SCORE_CONFIG,
  BODY_SCORE_MAX,
  BODY_TENDENCY_THRESHOLDS,
  MAIN_SCORE_MAX_RAW,
  MAIN_SCORE_ORDER,
  MAIN_SCORE_WEIGHTS,
  type WeightedQuestionId,
} from "./scoreConfig";
import type {
  AnswerItem,
  BodyFigureValues,
  MainScoreName,
  MainScores,
  QuestionId,
  ScoreDetail,
  ScoreSnapshot,
  SubScores,
} from "./types";

type AnswerScoreMap = Partial<Record<QuestionId, number>>;

function clampPercent(score: number) {
  return Math.max(0, Math.min(100, score));
}

function clampSignedScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(-4, Math.min(4, score));
}

function snapDisplayScore(score: number) {
  return Math.round(clampSignedScore(score));
}

function percentToLevel(score: number) {
  if (score <= 9) return 0;
  if (score <= 29) return 1;
  if (score <= 49) return 2;
  if (score <= 69) return 3;
  if (score <= 84) return 4;
  return 5;
}

function normalizePercent(rawScore: number, maxScore: number) {
  if (!Number.isFinite(rawScore) || !Number.isFinite(maxScore) || maxScore <= 0) return 0;
  return clampPercent((rawScore / maxScore) * 100);
}

function answersToScoreMap(answers: AnswerItem[]): AnswerScoreMap {
  return answers.reduce<AnswerScoreMap>((accumulator, answer) => {
    accumulator[answer.questionId] = answer.selectedOption;
    return accumulator;
  }, {});
}

function getAnswerScore(answerMap: AnswerScoreMap, questionId: QuestionId) {
  return answerMap[questionId] ?? 0;
}

function averageWeighted(answerMap: AnswerScoreMap, weightedQuestionIds: readonly WeightedQuestionId[]) {
  let total = 0;
  let totalWeight = 0;

  for (const entry of weightedQuestionIds) {
    const [questionId, weight] = Array.isArray(entry) ? entry : [entry, 1];
    total += getAnswerScore(answerMap, questionId) * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? total / totalWeight : 0;
}

function sumWeighted(answerMap: AnswerScoreMap, weightedQuestionIds: readonly WeightedQuestionId[]) {
  let total = 0;

  for (const entry of weightedQuestionIds) {
    const [questionId, weight] = Array.isArray(entry) ? entry : [entry, 1];
    total += getAnswerScore(answerMap, questionId) * weight;
  }

  return total;
}

function buildScoreDetail(raw: number, max: number, percent: number): ScoreDetail {
  return {
    raw: Number(raw.toFixed(2)),
    max,
    percent: Number(percent.toFixed(1)),
    level: percentToLevel(percent),
  };
}

function getOketsuConfidenceFactor(answerMap: AnswerScoreMap) {
  const q9Score = getAnswerScore(answerMap, "Q09");
  const q10Score = getAnswerScore(answerMap, "Q10");

  if (q9Score >= 3 && q10Score >= 3) return 1.0;
  if (q9Score >= 2 && q10Score >= 2) return 0.9;
  if ((q9Score >= 3 && q10Score <= 1) || (q10Score >= 3 && q9Score <= 1)) return 0.6;
  if ((q9Score >= 2 && q10Score === 0) || (q10Score >= 2 && q9Score === 0)) return 0.5;
  if (q9Score <= 1 && q10Score <= 1) return 0.4;
  return 0.75;
}

function regionalPercentToTextureScore(percent: number, direction: "dry" | "damp") {
  const magnitude = Math.max(0, Math.min(4, (percent / 100) * 4));
  return direction === "dry" ? -magnitude : magnitude;
}

function pickRegionalTextureScore(dampPercent: number, dryPercent: number) {
  if (dampPercent <= 0 && dryPercent <= 0) return 0;
  if (dampPercent > dryPercent) return regionalPercentToTextureScore(dampPercent, "damp");
  if (dryPercent > dampPercent) return regionalPercentToTextureScore(dryPercent, "dry");
  return 0;
}

function hasMinimumAnswer(answerMap: AnswerScoreMap, questionId: QuestionId, minimumValue: number) {
  return getAnswerScore(answerMap, questionId) >= minimumValue;
}

export function computeMainScores(answers: AnswerItem[]): MainScores {
  const answerMap = answersToScoreMap(answers);
  const oketsuConfidenceFactor = getOketsuConfidenceFactor(answerMap);

  const entries = MAIN_SCORE_ORDER.map((parameter) => {
    let rawScore = 0;

    for (const [questionId, weights] of Object.entries(MAIN_SCORE_WEIGHTS) as Array<
      [QuestionId, Partial<Record<MainScoreName, number>>]
    >) {
      rawScore += getAnswerScore(answerMap, questionId) * (weights[parameter] ?? 0);
    }

    const maxScore = MAIN_SCORE_MAX_RAW[parameter];
    const basePercent = normalizePercent(rawScore, maxScore);
    const finalPercent =
      parameter === "瘀血" ? clampPercent(basePercent * oketsuConfidenceFactor) : basePercent;

    return [parameter, buildScoreDetail(rawScore, maxScore, finalPercent)];
  });

  return Object.fromEntries(entries) as MainScores;
}

export function computeSubScores(answers: AnswerItem[]): SubScores {
  const answerMap = answersToScoreMap(answers);

  const dryRaw = sumWeighted(answerMap, BODY_SCORE_CONFIG.dry);
  const dampRaw = sumWeighted(answerMap, BODY_SCORE_CONFIG.damp);
  const upperDampRaw = sumWeighted(answerMap, BODY_SCORE_CONFIG.upperDamp);
  const lowerDampRaw = sumWeighted(answerMap, BODY_SCORE_CONFIG.lowerDamp);
  const upperDryRaw = sumWeighted(answerMap, BODY_SCORE_CONFIG.upperDry);
  const lowerDryRaw = sumWeighted(answerMap, BODY_SCORE_CONFIG.lowerDry);

  return {
    dry: buildScoreDetail(dryRaw, BODY_SCORE_MAX.dry, normalizePercent(dryRaw, BODY_SCORE_MAX.dry)),
    damp: buildScoreDetail(
      dampRaw,
      BODY_SCORE_MAX.damp,
      normalizePercent(dampRaw, BODY_SCORE_MAX.damp),
    ),
    upperDamp: buildScoreDetail(
      upperDampRaw,
      BODY_SCORE_MAX.upperDamp,
      normalizePercent(upperDampRaw, BODY_SCORE_MAX.upperDamp),
    ),
    lowerDamp: buildScoreDetail(
      lowerDampRaw,
      BODY_SCORE_MAX.lowerDamp,
      normalizePercent(lowerDampRaw, BODY_SCORE_MAX.lowerDamp),
    ),
    upperDry: buildScoreDetail(
      upperDryRaw,
      BODY_SCORE_MAX.upperDry,
      normalizePercent(upperDryRaw, BODY_SCORE_MAX.upperDry),
    ),
    lowerDry: buildScoreDetail(
      lowerDryRaw,
      BODY_SCORE_MAX.lowerDry,
      normalizePercent(lowerDryRaw, BODY_SCORE_MAX.lowerDry),
    ),
  };
}

export function computeBodyFigureValues(answers: AnswerItem[]): BodyFigureValues {
  const answerMap = answersToScoreMap(answers);
  const subScores = computeSubScores(answers);

  const deficiencyBurden = averageWeighted(answerMap, BODY_SCORE_CONFIG.deficiencySignals);
  const accumulationBurden = averageWeighted(answerMap, BODY_SCORE_CONFIG.accumulationSignals);
  const upperHeatSignals = averageWeighted(answerMap, BODY_SCORE_CONFIG.upperHeatSignals);
  const upperColdSignals = averageWeighted(answerMap, BODY_SCORE_CONFIG.upperColdSignals);
  const lowerHeatSignals = averageWeighted(answerMap, BODY_SCORE_CONFIG.lowerHeatSignals);
  const lowerColdSignals = averageWeighted(answerMap, BODY_SCORE_CONFIG.lowerColdSignals);

  const hasUpperDampTendency =
    subScores.damp.percent >= BODY_TENDENCY_THRESHOLDS.upperDamp.global &&
    subScores.upperDamp.percent >= BODY_TENDENCY_THRESHOLDS.upperDamp.local;
  const hasLowerDampTendency =
    subScores.damp.percent >= BODY_TENDENCY_THRESHOLDS.lowerDamp.global &&
    subScores.lowerDamp.percent >= BODY_TENDENCY_THRESHOLDS.lowerDamp.local &&
    hasMinimumAnswer(
      answerMap,
      BODY_TENDENCY_THRESHOLDS.lowerDamp.minimumQuestion,
      BODY_TENDENCY_THRESHOLDS.lowerDamp.minimumValue,
    );
  const hasUpperDryTendency =
    subScores.dry.percent >= BODY_TENDENCY_THRESHOLDS.upperDry.global &&
    subScores.upperDry.percent >= BODY_TENDENCY_THRESHOLDS.upperDry.local;
  const hasLowerDryTendency =
    subScores.dry.percent >= BODY_TENDENCY_THRESHOLDS.lowerDry.global &&
    subScores.lowerDry.percent >= BODY_TENDENCY_THRESHOLDS.lowerDry.local &&
    hasMinimumAnswer(
      answerMap,
      BODY_TENDENCY_THRESHOLDS.lowerDry.minimumQuestion,
      BODY_TENDENCY_THRESHOLDS.lowerDry.minimumValue,
    );

  const upperRegionalTextureScore = pickRegionalTextureScore(
    hasUpperDampTendency ? subScores.upperDamp.percent : 0,
    hasUpperDryTendency ? subScores.upperDry.percent : 0,
  );
  const lowerRegionalTextureScore = pickRegionalTextureScore(
    hasLowerDampTendency ? subScores.lowerDamp.percent : 0,
    hasLowerDryTendency ? subScores.lowerDry.percent : 0,
  );

  const soshitsu = clampSignedScore((subScores.damp.raw - subScores.dry.raw) / 4);

  return {
    kyojitsu: snapDisplayScore(accumulationBurden - deficiencyBurden),
    upperTemp: snapDisplayScore((upperHeatSignals - upperColdSignals) * 0.85),
    lowerTemp: snapDisplayScore(lowerHeatSignals - lowerColdSignals),
    soshitsu: snapDisplayScore(soshitsu),
    upperTextureScore: snapDisplayScore(
      upperRegionalTextureScore !== 0 ? upperRegionalTextureScore : soshitsu,
    ),
    lowerTextureScore: snapDisplayScore(
      lowerRegionalTextureScore !== 0 ? lowerRegionalTextureScore : soshitsu,
    ),
  };
}

export function computeScoreSnapshot(answers: AnswerItem[]): ScoreSnapshot {
  return {
    mainScores: computeMainScores(answers),
    subScores: computeSubScores(answers),
    bodyFigureValues: computeBodyFigureValues(answers),
  };
}
