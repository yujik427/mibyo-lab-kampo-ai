import type { BodyFigureValues, BodyLabels } from "./types";

function normalizeSignedScore(score: number) {
  return Math.max(-4, Math.min(4, Math.round(score)));
}

export function getKyojitsuLabel(score: number) {
  const normalized = normalizeSignedScore(score);
  if (normalized <= -1) return "虚寄り";
  if (normalized >= 1) return "実寄り";
  return "中間";
}

export function getTemperatureLabel(score: number) {
  const normalized = normalizeSignedScore(score);
  if (normalized <= -3) return "強く冷えている";
  if (normalized === -2) return "冷えている";
  if (normalized === -1) return "やや冷えている";
  if (normalized === 0) return "中間";
  if (normalized === 1) return "やや熱がこもっている";
  if (normalized === 2) return "熱がこもっている";
  return "強く熱がこもっている";
}

export function getTextureLabel(score: number) {
  const normalized = normalizeSignedScore(score);
  if (normalized <= -3) return "強く乾いている";
  if (normalized === -2) return "乾いている";
  if (normalized === -1) return "やや乾いている";
  if (normalized === 0) return "中間";
  if (normalized === 1) return "やや水分がたまっている";
  if (normalized === 2) return "水分がたまっている";
  return "強く水分がたまっている";
}

export function buildBodyLabels(bodyFigureValues: BodyFigureValues): BodyLabels {
  return {
    kyojitsu: getKyojitsuLabel(bodyFigureValues.kyojitsu),
    upperTemperature: getTemperatureLabel(bodyFigureValues.upperTemp),
    lowerTemperature: getTemperatureLabel(bodyFigureValues.lowerTemp),
    upperTexture: getTextureLabel(bodyFigureValues.upperTextureScore),
    lowerTexture: getTextureLabel(bodyFigureValues.lowerTextureScore),
  };
}
