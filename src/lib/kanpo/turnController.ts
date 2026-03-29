import {
  CATEGORY_REGISTRY,
  INTERVIEW_MAX_TURNS,
} from "./categoryRegistry";
import type { CategoryId, ScoreSlotId, ScoreSlotState } from "./types";

type ScoreSlotStateLike = Pick<ScoreSlotState, "status"> | ScoreSlotState;

export interface TurnControllerInput {
  nextTurnNumber: number;
  lastCategoryId?: CategoryId | null;
  chiefComplaintCategoryHints?: readonly CategoryId[];
  scoreSlotStates?: Partial<Record<ScoreSlotId, ScoreSlotStateLike>>;
}

export interface TurnControllerCategoryScore {
  categoryId: CategoryId;
  score: number;
  confirmedCount: number;
  unresolvedCount: number;
  reasons: string[];
}

export interface TurnControllerDecision {
  nextCategoryId: CategoryId;
  categoryScores: TurnControllerCategoryScore[];
}

const STRICT_CHIEF_COMPLAINT_TURNS = 2;
const STRONG_CHIEF_COMPLAINT_BIAS_TURNS = 4;

function clampTurnNumber(turnNumber: number) {
  if (!Number.isFinite(turnNumber)) return 1;
  return Math.max(1, Math.min(INTERVIEW_MAX_TURNS, Math.trunc(turnNumber)));
}

function getSlotStatus(
  scoreSlotStates: TurnControllerInput["scoreSlotStates"],
  slotId: ScoreSlotId,
) {
  return scoreSlotStates?.[slotId]?.status ?? "empty";
}

function buildCategoryScore(args: {
  categoryId: CategoryId;
  nextTurnNumber: number;
  lastCategoryId?: CategoryId | null;
  chiefComplaintHints: ReadonlySet<CategoryId>;
  chiefComplaintPriority: ReadonlyMap<CategoryId, number>;
  scoreSlotStates?: TurnControllerInput["scoreSlotStates"];
}): TurnControllerCategoryScore {
  const category = CATEGORY_REGISTRY.find((entry) => entry.id === args.categoryId);
  if (!category) {
    return {
      categoryId: args.categoryId,
      score: Number.NEGATIVE_INFINITY,
      confirmedCount: 0,
      unresolvedCount: 0,
      reasons: ["カテゴリ定義なし"],
    };
  }

  const confirmedCount = category.scoreSlotIds.filter(
    (slotId) => getSlotStatus(args.scoreSlotStates, slotId) === "confirmed",
  ).length;
  const unresolvedCount = category.scoreSlotIds.length - confirmedCount;
  const isCompletelyUnstarted = confirmedCount === 0;

  let score = 0;
  const reasons: string[] = [];

  if (category.required) {
    score += 30;
    reasons.push("requiredカテゴリ");
  }

  if (isCompletelyUnstarted) {
    score += 40;
    reasons.push("まだ着手していないカテゴリ");
  }

  if (
    category.chiefComplaintBiasEligible &&
    args.chiefComplaintHints.has(category.id)
  ) {
    const priority = args.chiefComplaintPriority.get(category.id) ?? 0;
    score += 18 + Math.max(0, 8 - priority * 3);
    reasons.push("主訴関連カテゴリ");

    if (args.nextTurnNumber <= STRONG_CHIEF_COMPLAINT_BIAS_TURNS) {
      score += 55 - priority * 10;
      reasons.push(`序盤なので主訴優先(${priority + 1}位)`);
    }
  }

  if (args.lastCategoryId === category.id) {
    score -= 14;
    reasons.push("直前カテゴリの連続を少し回避");
  }

  const [windowStart, windowEnd] = category.targetTurnWindow;
  if (args.nextTurnNumber >= windowStart && args.nextTurnNumber <= windowEnd) {
    score += 12;
    reasons.push("想定ターン帯に入っている");
  } else if (args.nextTurnNumber < windowStart) {
    score -= 8;
    reasons.push("まだ想定ターン帯より早い");
  }

  if (args.nextTurnNumber === INTERVIEW_MAX_TURNS) {
    score += unresolvedCount * 100;
    reasons.push(`turn20なので未確定slot数(${unresolvedCount})を強く優先`);
  } else {
    score += Math.min(unresolvedCount, 1) * 8;
    if (unresolvedCount > 0) {
      reasons.push("未確定slotあり");
    }
  }

  return {
    categoryId: category.id,
    score,
    confirmedCount,
    unresolvedCount,
    reasons,
  };
}

function sortCategoryScores(left: TurnControllerCategoryScore, right: TurnControllerCategoryScore) {
  if (right.score !== left.score) return right.score - left.score;
  if (right.unresolvedCount !== left.unresolvedCount) return right.unresolvedCount - left.unresolvedCount;
  if (left.confirmedCount !== right.confirmedCount) return left.confirmedCount - right.confirmedCount;
  return left.categoryId.localeCompare(right.categoryId);
}

export function getTurnControllerDecision(
  input: TurnControllerInput,
): TurnControllerDecision {
  const nextTurnNumber = clampTurnNumber(input.nextTurnNumber);

  const chiefComplaintHintOrder = (input.chiefComplaintCategoryHints ?? []).filter(
    (categoryId): categoryId is Exclude<CategoryId, "safety_check"> =>
      categoryId !== "safety_check",
  );
  const chiefComplaintHints = new Set<CategoryId>(chiefComplaintHintOrder);
  const chiefComplaintPriority = new Map<CategoryId, number>(
    chiefComplaintHintOrder.map((categoryId, index) => [categoryId, index]),
  );

  const regularCategoryScores = CATEGORY_REGISTRY
    .filter((category) => category.id !== "safety_check")
    .map((category) =>
      buildCategoryScore({
        categoryId: category.id,
        nextTurnNumber,
        lastCategoryId: input.lastCategoryId,
        chiefComplaintHints,
        chiefComplaintPriority,
        scoreSlotStates: input.scoreSlotStates,
      }),
    );

  const unresolvedCategories = regularCategoryScores.filter(
    (category) => category.unresolvedCount > 0,
  );
  const hintedUnresolvedCategories = unresolvedCategories.filter((category) =>
    chiefComplaintHints.has(category.categoryId),
  );

  if (nextTurnNumber === 1 && hintedUnresolvedCategories.length > 0) {
    const hintedByPriority = [...hintedUnresolvedCategories].sort((left, right) => {
      const leftPriority = chiefComplaintPriority.get(left.categoryId) ?? Number.POSITIVE_INFINITY;
      const rightPriority = chiefComplaintPriority.get(right.categoryId) ?? Number.POSITIVE_INFINITY;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return sortCategoryScores(left, right);
    });

    return {
      nextCategoryId: hintedByPriority[0]?.categoryId ?? "sleep_recovery",
      categoryScores: [...regularCategoryScores].sort(sortCategoryScores),
    };
  }

  const selectionPool =
    nextTurnNumber <= STRICT_CHIEF_COMPLAINT_TURNS && hintedUnresolvedCategories.length > 0
      ? hintedUnresolvedCategories
      : unresolvedCategories.length > 0
        ? unresolvedCategories
        : regularCategoryScores;

  const sortedPool = [...selectionPool].sort(sortCategoryScores);

  return {
    nextCategoryId: sortedPool[0]?.categoryId ?? "sleep_recovery",
    categoryScores: [...regularCategoryScores].sort(sortCategoryScores),
  };
}

export function selectNextCategoryId(input: TurnControllerInput) {
  return getTurnControllerDecision(input).nextCategoryId;
}
