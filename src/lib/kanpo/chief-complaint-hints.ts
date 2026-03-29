import { CATEGORY_REGISTRY } from "./categoryRegistry";
import {
  buildChiefComplaintAliasWeightMap,
  countChiefComplaintKeywordMatches,
  getChiefComplaintHintKeywordsForCategory,
  getChiefComplaintKeywordsForSlot,
  resolveChiefComplaintQuestionText,
} from "./chiefComplaintMaster";
import { SCORE_SLOT_REGISTRY } from "./slotRegistry";
import type { CategoryId, ChiefComplaintCategoryHint, ScoreSlotId } from "./types";

export function inferChiefComplaintCategoryHints(message: string): ChiefComplaintCategoryHint[] {
  const normalized = message.trim();
  if (!normalized) return [];
  const aliasScoreMap = buildChiefComplaintAliasWeightMap(normalized);

  const ranked = CATEGORY_REGISTRY.filter(
    (category): category is (typeof CATEGORY_REGISTRY)[number] & { id: ChiefComplaintCategoryHint } =>
      category.id !== "safety_check",
  )
    .map((category) => {
      const categoryKeywordScore = countChiefComplaintKeywordMatches(
        normalized,
        getChiefComplaintHintKeywordsForCategory(category.id, category.chiefComplaintHintKeywords),
      );
      const slotKeywordScore = SCORE_SLOT_REGISTRY.filter(
        (slot) => slot.categoryId === category.id,
      ).reduce(
        (total, slot) =>
          total +
          countChiefComplaintKeywordMatches(
            normalized,
            getChiefComplaintKeywordsForSlot(slot.id, slot.chiefComplaintKeywords),
          ),
        0,
      );

      return {
        categoryId: category.id,
        score:
          categoryKeywordScore * 3 +
          slotKeywordScore +
          (aliasScoreMap.get(category.id) ?? 0),
        targetTurnStart: category.targetTurnWindow[0],
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.targetTurnStart - right.targetTurnStart;
    });

  return ranked.slice(0, 3).map((entry) => entry.categoryId);
}

export function adaptChiefComplaintQuestionText(args: {
  chiefComplaintSummary: string;
  selectedCategoryId: CategoryId;
  selectedSlotId: ScoreSlotId | null;
  questionText: string;
}) {
  const currentQuestion = args.questionText.trim();
  return resolveChiefComplaintQuestionText({
    chiefComplaintSummary: args.chiefComplaintSummary,
    selectedSlotId: args.selectedSlotId,
    currentQuestion,
  });
}
