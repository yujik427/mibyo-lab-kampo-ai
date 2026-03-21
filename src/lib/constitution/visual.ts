export type TextureType = "dry" | "damp" | "none";
export type BodyVariant = "slim" | "standard" | "solid";

export interface TexturePatternParams {
  spacing: number;
  dryStrokeWidth: number;
  dampDotRadius: number;
  dampOffsetDotRadius: number;
}

export interface ConstitutionAvatarScores {
  isFrequencyBased: boolean;
  kyojitsu: number;
  upperTemp: number;
  lowerTemp: number;
  soshitsu: number;
  dryScore: number;
  dampScore: number;
  upperDampScore: number;
  lowerDampScore: number;
  upperDryScore: number;
  lowerDryScore: number;
  hasUpperDampTendency: boolean;
  hasLowerDampTendency: boolean;
  hasUpperDryTendency: boolean;
  hasLowerDryTendency: boolean;
}

export interface ConstitutionAvatarDisplayState {
  kyojitsu: number;
  upperTemp: number;
  lowerTemp: number;
  soshitsu: number;
  upperDampScore: number;
  lowerDampScore: number;
  upperDryScore: number;
  lowerDryScore: number;
  upperTextureScore: number;
  lowerTextureScore: number;
}

export const TEMPERATURE_COLORS = {
  heat: "#E58A7A",
  cold: "#7FB6E6",
} as const;

export const TEXTURE_COLORS = {
  dry: "#8A6A52",
  damp: "#97A892",
} as const;

export const TEXTURE_DRY_ROTATION = 32;

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const value = Number.parseInt(safeHex, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function colorWithOpacity(hex: string, opacity: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export const DEFAULT_CONSTITUTION_AVATAR_SCORES: ConstitutionAvatarScores = {
  isFrequencyBased: false,
  kyojitsu: 0,
  upperTemp: 0,
  lowerTemp: 0,
  soshitsu: 0,
  dryScore: 0,
  dampScore: 0,
  upperDampScore: 0,
  lowerDampScore: 0,
  upperDryScore: 0,
  lowerDryScore: 0,
  hasUpperDampTendency: false,
  hasLowerDampTendency: false,
  hasUpperDryTendency: false,
  hasLowerDryTendency: false,
};

function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(-4, Math.min(4, score));
}

function snapDisplayScore(score: number) {
  return Math.round(clampScore(score));
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function interpolateStops(intensity: number, stops: readonly [number, number][]) {
  if (intensity <= stops[0][0]) return stops[0][1];

  for (let i = 1; i < stops.length; i += 1) {
    const [currentX, currentY] = stops[i];
    const [previousX, previousY] = stops[i - 1];

    if (intensity <= currentX) {
      const localT = (intensity - previousX) / (currentX - previousX);
      return lerp(previousY, currentY, localT);
    }
  }

  return stops[stops.length - 1][1];
}

function averageMappedScore(
  answers: Record<string, string> | undefined,
  scoreMap: Record<string, Record<string, number>>,
) {
  if (!answers) return 0;

  let total = 0;
  let count = 0;

  for (const [questionId, answerScores] of Object.entries(scoreMap)) {
    const answer = answers[questionId];
    if (!answer || answerScores[answer] === undefined) continue;

    total += answerScores[answer];
    count += 1;
  }

  return count > 0 ? clampScore(total / count) : 0;
}

export function normalizeScore(score: number) {
  return clampScore(score) / 4;
}

export function scoreToIntensity(score: number) {
  return Math.abs(normalizeScore(score));
}

export function scoreToBodyVariant(score: number): BodyVariant {
  const roundedScore = Math.round(clampScore(score));

  if (roundedScore <= -2) return "slim";
  if (roundedScore >= 2) return "solid";
  return "standard";
}

export function scoreToBodyAssetName(score: number) {
  return `body-${scoreToBodyVariant(score)}`;
}

export function scoreToTemperatureColor(score: number) {
  const normalized = normalizeScore(score);

  if (normalized < 0) return TEMPERATURE_COLORS.cold;
  if (normalized > 0) return TEMPERATURE_COLORS.heat;
  return "transparent";
}

export function scoreToTemperatureOpacity(score: number) {
  const intensity = scoreToIntensity(score);
  return interpolateStops(intensity, [
    [0, 0],
    [0.25, 0.2],
    [0.5, 0.32],
    [0.75, 0.45],
    [1, 0.58],
  ]);
}

export function scoreToTextureType(score: number): TextureType {
  const normalized = normalizeScore(score);

  if (normalized < 0) return "dry";
  if (normalized > 0) return "damp";
  return "none";
}

export function scoreToTexturePatternParams(score: number): TexturePatternParams {
  const intensity = scoreToIntensity(score);

  return {
    spacing: lerp(11, 4.5, intensity),
    dryStrokeWidth: lerp(1.1, 2.2, intensity),
    dampDotRadius: lerp(1.2, 2.5, intensity),
    dampOffsetDotRadius: lerp(0.9, 1.9, intensity),
  };
}

export function scoreToTextureOpacity(score: number) {
  const intensity = scoreToIntensity(score);
  return interpolateStops(intensity, [
    [0, 0],
    [0.25, 0.18],
    [0.5, 0.3],
    [0.75, 0.42],
    [1, 0.54],
  ]);
}

export function scoreToTextureDisplayOpacity(score: number) {
  const baseOpacity = scoreToTextureOpacity(score);
  return baseOpacity > 0 ? Math.min(0.95, baseOpacity + 0.08) : 0;
}

export function scoreToTextureBackgroundStyle(score: number) {
  const pattern = scoreToTexturePatternParams(score);
  const textureType = scoreToTextureType(score);
  const opacity = scoreToTextureDisplayOpacity(score);

  if (textureType === "none" || opacity <= 0) {
    return {
      backgroundImage: "none",
      backgroundSize: `${pattern.spacing}px ${pattern.spacing}px`,
      backgroundRepeat: "repeat" as const,
    };
  }

  if (textureType === "dry") {
    return {
      backgroundImage: `repeating-linear-gradient(${TEXTURE_DRY_ROTATION}deg, ${colorWithOpacity(TEXTURE_COLORS.dry, opacity)} 0 ${pattern.dryStrokeWidth}px, transparent ${pattern.dryStrokeWidth}px ${pattern.spacing}px)`,
      backgroundSize: `${pattern.spacing}px ${pattern.spacing}px`,
      backgroundRepeat: "repeat" as const,
    };
  }

  const dampPrimaryRadius = pattern.dampDotRadius * 0.72;
  const dampSecondaryRadius = pattern.dampOffsetDotRadius * 0.52;
  const dampPrimaryColor = colorWithOpacity(TEXTURE_COLORS.damp, Math.min(0.82, opacity));
  const dampSecondaryColor = colorWithOpacity(TEXTURE_COLORS.damp, Math.min(0.6, opacity * 0.72));

  return {
    backgroundImage: `radial-gradient(circle at ${pattern.spacing * 0.28}px ${pattern.spacing * 0.28}px, ${dampPrimaryColor} 0 ${dampPrimaryRadius}px, transparent ${dampPrimaryRadius + 0.45}px), radial-gradient(circle at ${pattern.spacing * 0.74}px ${pattern.spacing * 0.4}px, ${dampSecondaryColor} 0 ${dampSecondaryRadius}px, transparent ${dampSecondaryRadius + 0.35}px), radial-gradient(circle at ${pattern.spacing * 0.54}px ${pattern.spacing * 0.8}px, ${dampSecondaryColor} 0 ${dampSecondaryRadius * 0.92}px, transparent ${dampSecondaryRadius * 0.92 + 0.35}px)`,
    backgroundSize: `${pattern.spacing}px ${pattern.spacing}px`,
    backgroundRepeat: "repeat" as const,
  };
}

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

function getFrequencyAnswerScore(answer: string | undefined) {
  if (!answer) return null;

  const mappedScore = FREQUENCY_ANSWER_SCORE_MAP[answer];
  if (mappedScore !== undefined) return mappedScore;

  const matched = answer.match(/^([0-4])(?:\s*[：:]\s*.*)?$/);
  return matched ? Number(matched[1]) : null;
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

function isFrequencyAnswerSet(answers?: Record<string, string>) {
  if (!answers) return false;

  const values = Object.values(answers);
  return values.length > 0 && values.every((answer) => getFrequencyAnswerScore(answer) !== null);
}

function averageFrequencyScore(
  answers: Record<string, string> | undefined,
  weightedQuestionIds: ReadonlyArray<string | readonly [string, number]>,
) {
  if (!answers) return 0;

  let total = 0;
  let totalWeight = 0;

  for (const entry of weightedQuestionIds) {
    const [questionId, weight] = Array.isArray(entry) ? entry : [entry, 1];
    const answerScore = getFrequencyAnswerScore(answers[questionId]);
    if (answerScore === null) continue;

    total += answerScore * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? total / totalWeight : 0;
}

function sumFrequencyScore(
  answers: Record<string, string> | undefined,
  weightedQuestionIds: ReadonlyArray<string | readonly [string, number]>,
) {
  if (!answers) return 0;

  let total = 0;

  for (const entry of weightedQuestionIds) {
    const [questionId, weight] = Array.isArray(entry) ? entry : [entry, 1];
    const answerScore = getFrequencyAnswerScore(answers[questionId]);
    if (answerScore === null) continue;

    total += answerScore * weight;
  }

  return total;
}

function normalizePercent(rawScore: number, maxScore: number) {
  if (!Number.isFinite(rawScore) || !Number.isFinite(maxScore) || maxScore <= 0) return 0;
  return Math.max(0, Math.min(100, (rawScore / maxScore) * 100));
}

function hasMinimumFrequencyAnswer(
  answers: Record<string, string> | undefined,
  questionId: string,
  minimumScore: number,
) {
  const answerScore = getFrequencyAnswerScore(answers?.[questionId]);
  return answerScore !== null && answerScore >= minimumScore;
}

function frequencyAnswersToConstitutionAvatarScores(
  answers: Record<string, string>,
): ConstitutionAvatarScores {
  const deficiencyBurden = averageFrequencyScore(answers, [
    ["q1", 1],
    ["q2", 1],
    ["q7", 0.8],
    ["q8", 0.8],
    ["q15", 1],
    ["q20", 0.8],
  ]);
  const accumulationBurden = averageFrequencyScore(answers, [
    ["q9", 1],
    ["q10", 0.9],
    ["q11", 1],
    ["q12", 1],
    ["q17", 0.8],
    ["q19", 0.7],
  ]);
  const upperHeatSignals = averageFrequencyScore(answers, [
    ["q3", 0.8],
    ["q4", 1],
    ["q5", 1],
    ["q6", 1],
    ["q13", 0.7],
    ["q14", 0.6],
    ["q16", 1],
  ]);
  const upperColdSignals = averageFrequencyScore(answers, [
    ["q1", 1],
    ["q2", 1],
    ["q7", 0.6],
    ["q8", 0.6],
    ["q20", 0.6],
  ]);
  const lowerHeatSignals = averageFrequencyScore(answers, [
    ["q9", 1],
    ["q10", 0.9],
    ["q18", 0.8],
  ]);
  const lowerColdSignals = averageFrequencyScore(answers, [
    ["q11", 1],
    ["q12", 1],
    ["q15", 0.9],
    ["q17", 1],
    ["q19", 0.8],
  ]);
  const dryRaw = sumFrequencyScore(answers, ["q13", "q14", "q18", "q20"]);
  const dampRaw = sumFrequencyScore(answers, ["q11", "q12", "q17", "q19"]);
  const upperDampRaw = sumFrequencyScore(answers, ["q12", "q19", ["q11", 0.5], ["q17", 0.5]]);
  const lowerDampRaw = sumFrequencyScore(answers, ["q11", ["q12", 0.5], ["q17", 0.5], ["q19", 0.5]]);
  const upperDryRaw = sumFrequencyScore(answers, ["q13", "q20", ["q14", 0.5], ["q18", 0.5]]);
  const lowerDryRaw = sumFrequencyScore(answers, ["q14", ["q13", 0.5], ["q18", 0.5], ["q20", 0.5]]);
  const dryScore = normalizePercent(dryRaw, 16);
  const dampScore = normalizePercent(dampRaw, 16);
  const upperDampScore = normalizePercent(upperDampRaw, 12);
  const lowerDampScore = normalizePercent(lowerDampRaw, 10);
  const upperDryScore = normalizePercent(upperDryRaw, 12);
  const lowerDryScore = normalizePercent(lowerDryRaw, 10);
  const hasUpperDampTendency = dampScore >= 45 && upperDampScore >= 60;
  const hasLowerDampTendency =
    dampScore >= 45 && lowerDampScore >= 65 && hasMinimumFrequencyAnswer(answers, "q11", 2);
  const hasUpperDryTendency = dryScore >= 45 && upperDryScore >= 60;
  const hasLowerDryTendency =
    dryScore >= 45 && lowerDryScore >= 65 && hasMinimumFrequencyAnswer(answers, "q14", 2);

  return {
    isFrequencyBased: true,
    kyojitsu: clampScore(accumulationBurden - deficiencyBurden),
    upperTemp: clampScore((upperHeatSignals - upperColdSignals) * 0.85),
    lowerTemp: clampScore(lowerHeatSignals - lowerColdSignals),
    soshitsu: clampScore((dampRaw - dryRaw) / 4),
    dryScore,
    dampScore,
    upperDampScore,
    lowerDampScore,
    upperDryScore,
    lowerDryScore,
    hasUpperDampTendency,
    hasLowerDampTendency,
    hasUpperDryTendency,
    hasLowerDryTendency,
  };
}

export function avatarScoresToDisplayState(
  scores: ConstitutionAvatarScores,
): ConstitutionAvatarDisplayState {
  const upperDampScore = scores.hasUpperDampTendency ? scores.upperDampScore : 0;
  const lowerDampScore = scores.hasLowerDampTendency ? scores.lowerDampScore : 0;
  const upperDryScore = scores.hasUpperDryTendency ? scores.upperDryScore : 0;
  const lowerDryScore = scores.hasLowerDryTendency ? scores.lowerDryScore : 0;
  const upperRegionalTextureScore = pickRegionalTextureScore(upperDampScore, upperDryScore);
  const lowerRegionalTextureScore = pickRegionalTextureScore(lowerDampScore, lowerDryScore);

  return {
    kyojitsu: snapDisplayScore(scores.kyojitsu),
    upperTemp: snapDisplayScore(scores.upperTemp),
    lowerTemp: snapDisplayScore(scores.lowerTemp),
    soshitsu: snapDisplayScore(scores.soshitsu),
    upperDampScore,
    lowerDampScore,
    upperDryScore,
    lowerDryScore,
    upperTextureScore: snapDisplayScore(
      upperRegionalTextureScore !== 0 ? upperRegionalTextureScore : scores.soshitsu,
    ),
    lowerTextureScore: snapDisplayScore(
      lowerRegionalTextureScore !== 0 ? lowerRegionalTextureScore : scores.soshitsu,
    ),
  };
}

const KYOJITSU_SCORE_MAP: Record<string, Record<string, number>> = {
  q1: {
    元気で調子が良い: 4,
    普通: 1,
    疲れやすい: -2,
    体が弱い: -4,
  },
  q5: {
    食欲旺盛: 3,
    普通: 1,
    食欲がない: -2,
    食欲が不安定: -1,
  },
  q18: {
    疲れにくい: 4,
    少し疲れやすい: -1,
    疲れやすい: -2,
    とても疲れやすい: -4,
  },
  q19: {
    よくする: 3,
    たまにする: 1,
    ほとんどしない: -1,
    全くしない: -2,
  },
};

const UPPER_TEMP_SCORE_MAP: Record<string, Record<string, number>> = {
  q2: {
    かなり冷える: -4,
    少し冷える: -2,
    たまに冷える: -1,
    冷えは感じない: 0,
  },
  q3: {
    よくある: 4,
    たまにある: 2,
    ほとんどない: 0,
    全くない: 0,
  },
  q4: {
    よく汗をかく: 2,
    普通: 0,
    あまり汗をかかない: -1,
    ほとんど汗をかかない: -2,
  },
  q17: {
    よくイライラする: 2,
    たまにイライラする: 1,
    あまりイライラしない: 0,
    ほとんどイライラしない: 0,
  },
};

const LOWER_TEMP_SCORE_MAP: Record<string, Record<string, number>> = {
  q2: {
    かなり冷える: -4,
    少し冷える: -2,
    たまに冷える: -1,
    冷えは感じない: 0,
  },
  q6: {
    毎日規則正しい: 0,
    便秘気味: 2,
    下痢気味: -2,
    不規則: 0,
  },
  q12: {
    よくある: -2,
    たまにある: -1,
    ほとんどない: 0,
    全くない: 0,
  },
};

const SOSHITSU_SCORE_MAP: Record<string, Record<string, number>> = {
  q4: {
    よく汗をかく: 1,
    普通: 0,
    あまり汗をかかない: -1,
    ほとんど汗をかかない: -2,
  },
  q12: {
    よくある: 3,
    たまにある: 2,
    ほとんどない: 0,
    全くない: 0,
  },
  q13: {
    きれい: 0,
    乾燥気味: -4,
    脂っぽい: 4,
    荒れている: -1,
  },
  q15: {
    よく感じる: -2,
    たまに感じる: -1,
    ほとんど感じない: 0,
    全く感じない: 0,
  },
  q16: {
    よく感じる: -2,
    たまに感じる: -1,
    ほとんど感じない: 0,
    全く感じない: 0,
  },
};

export function answersToConstitutionAvatarScores(
  answers?: Record<string, string>,
): ConstitutionAvatarScores {
  if (!answers || Object.keys(answers).length === 0) {
    return DEFAULT_CONSTITUTION_AVATAR_SCORES;
  }

  if (isFrequencyAnswerSet(answers)) {
    return frequencyAnswersToConstitutionAvatarScores(answers);
  }

  return {
    isFrequencyBased: false,
    kyojitsu: averageMappedScore(answers, KYOJITSU_SCORE_MAP),
    upperTemp: averageMappedScore(answers, UPPER_TEMP_SCORE_MAP),
    lowerTemp: averageMappedScore(answers, LOWER_TEMP_SCORE_MAP),
    soshitsu: averageMappedScore(answers, SOSHITSU_SCORE_MAP),
    dryScore: 0,
    dampScore: 0,
    upperDampScore: 0,
    lowerDampScore: 0,
    upperDryScore: 0,
    lowerDryScore: 0,
    hasUpperDampTendency: false,
    hasLowerDampTendency: false,
    hasUpperDryTendency: false,
    hasLowerDryTendency: false,
  };
}
