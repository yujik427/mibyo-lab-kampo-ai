import { getScoreSlotDefinition } from "./slotRegistry";
import type { CategoryId, ScoreSlotId } from "./types";

function clampOption(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(4, Math.trunc(value))) as 0 | 1 | 2 | 3 | 4;
}

function getSlotBasedSummary(slotId: ScoreSlotId, selectedOption: number) {
  const label = getScoreSlotDefinition(slotId).label;
  const option = clampOption(selectedOption);

  switch (option) {
    case 0:
      return `${label}は今のところ目立ちません。`;
    case 1:
      return `${label}はあまり目立ちません。`;
    case 2:
      return `${label}はときどきあります。`;
    case 3:
      return `${label}はよくあります。`;
    case 4:
      return `${label}はかなり続いています。`;
    default:
      return `${label}が気になります。`;
  }
}

function getSafetyCheckSummary(selectedOption: number) {
  const option = clampOption(selectedOption);

  switch (option) {
    case 0:
      return "早めに相談したい症状は特にありません。";
    case 1:
      return "早めに相談したいほどではない状態です。";
    case 2:
      return "少し気になる症状があります。";
    case 3:
      return "かなり気になる症状があります。";
    case 4:
      return "早めに相談したい症状があります。";
    default:
      return "安全面で気になる点があります。";
  }
}

export function buildTurnAnswerSummary(args: {
  selectedOption: number;
  optionalNote?: string;
  selectedSlotId?: ScoreSlotId | null;
  selectedCategoryId?: CategoryId;
  questionText?: string;
}) {
  const note = args.optionalNote?.trim();
  if (note) return note;

  if (args.selectedCategoryId === "safety_check") {
    return getSafetyCheckSummary(args.selectedOption);
  }

  if (args.selectedSlotId) {
    return getSlotBasedSummary(args.selectedSlotId, args.selectedOption);
  }

  const questionText = args.questionText?.trim().replace(/[。.!！?？]+$/u, "");
  if (questionText) {
    const option = clampOption(args.selectedOption);
    const suffix =
      option === 0
        ? "は今のところ目立ちません。"
        : option === 1
          ? "はあまり目立ちません。"
          : option === 2
            ? "はときどきあります。"
            : option === 3
              ? "はよくあります。"
              : "はかなり続いています。";
    return `${questionText}${suffix}`;
  }

  return "症状の程度を回答しました。";
}

export function isLowSignalTurnAnswerSummary(summary: string) {
  const normalized = summary.trim();
  if (!normalized) return true;

  return (
    /^[0-4]\s*を選択(?:しました)?[。.]?$/u.test(normalized) ||
    /^[0-4]\s+(?:まったくない|ほとんどない|ときどきある|よくある|ほぼ毎日ある)[。.]?$/u.test(
      normalized,
    )
  );
}
