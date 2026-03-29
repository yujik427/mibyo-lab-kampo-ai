import { getCategoryDefinition } from "../src/lib/kanpo/categoryRegistry";
import {
  buildTurnBuilderSlotCandidates,
  getScoreSlotDefinition,
} from "../src/lib/kanpo/slotRegistry";
import { computeScoreSnapshotFromConfirmedSlots } from "../src/lib/kanpo/scoreEngine";
import { selectNextCategoryId } from "../src/lib/kanpo/turnController";
import type {
  OpeningIntakeAnswerParserResult,
  ScoreSlotId,
  ScoreSlotState,
  TurnAnswerParserResult,
  TurnBuilderResult,
} from "../src/lib/kanpo/types";

const baseUrl = process.env.KANPO_BASE_URL ?? "http://127.0.0.1:3002";

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as T & { error?: string; detail?: string };
  if (!response.ok) {
    throw new Error(data.detail || data.error || `HTTP ${response.status}`);
  }

  return data;
}

async function main() {
  const opening = await postJson<OpeningIntakeAnswerParserResult>("/api/kanpo/answer-parser", {
    mode: "opening_intake",
    user_message: "夕方になると頭が重く、会議前は胃がムカムカしてお腹も張りやすいです。",
  });

  if (opening.mode !== "opening_intake") {
    throw new Error("opening_intake parser result was invalid");
  }

  const nextCategoryId = selectNextCategoryId({
    nextTurnNumber: 1,
    lastCategoryId: null,
    chiefComplaintCategoryHints: opening.chief_complaint_category_hints,
    scoreSlotStates: {},
  });

  if (nextCategoryId === "safety_check") {
    throw new Error("unexpected safety_check for turn 1");
  }

  const category = getCategoryDefinition(nextCategoryId);
  const candidateSlots = buildTurnBuilderSlotCandidates({
    categoryId: nextCategoryId,
    chiefComplaintSummary: opening.chief_complaint_summary,
    scoreSlotStates: {},
    limit: 3,
  });

  const turnBuilt = await postJson<TurnBuilderResult>("/api/kanpo/turn-builder", {
    turn_index: 1,
    selected_category_id: nextCategoryId,
    category_label: category.label,
    category_description: category.description,
    chief_complaint_summary: opening.chief_complaint_summary,
    previous_answer_summary: "",
    previous_feedback_hint: "",
    answer_mode: "scale_0_4_with_optional_note",
    options: [
      "0 まったくない",
      "1 ほとんどない",
      "2 ときどきある",
      "3 よくある",
      "4 ほぼ毎日ある",
    ],
    candidate_slots: candidateSlots,
  });

  const parserInput = {
    mode: "turn_answer",
    selected_category_id: nextCategoryId,
    selected_slot_id: turnBuilt.selected_slot_id,
    question_text: turnBuilt.question_text,
    selected_option: 3,
    optional_note: "会議前に胃がムカムカして、お腹の張りもよく出ます。",
    allowed_slot_ids: candidateSlots.map((slot) => slot.slot_id),
  } as const;

  const turnAnswer = await postJson<TurnAnswerParserResult>("/api/kanpo/answer-parser", parserInput);

  if (turnAnswer.mode !== "turn_answer") {
    throw new Error("turn_answer parser result was invalid");
  }

  const scoreSlotStates: Partial<Record<ScoreSlotId, ScoreSlotState>> = {};

  if (turnBuilt.selected_slot_id) {
    const selectedSlot = getScoreSlotDefinition(turnBuilt.selected_slot_id);
    scoreSlotStates[turnBuilt.selected_slot_id] = {
      slotId: selectedSlot.id,
      hiddenScoreKey: selectedSlot.hiddenScoreKey,
      value: Math.max(0, Math.min(4, Math.trunc(turnAnswer.selected_option))) as 0 | 1 | 2 | 3 | 4,
      status: "confirmed",
      confidence: turnAnswer.confidence,
      evidence: turnAnswer.free_text_summary,
      sourceTurn: 1,
    };
  }

  for (const hint of turnAnswer.possible_slot_hints) {
    if (!turnBuilt.selected_slot_id || hint.slot_id === turnBuilt.selected_slot_id) continue;
    const slot = getScoreSlotDefinition(hint.slot_id);
    scoreSlotStates[hint.slot_id] = {
      slotId: slot.id,
      hiddenScoreKey: slot.hiddenScoreKey,
      value: null,
      status: "tentative",
      confidence: hint.confidence,
      evidence: hint.reason,
      sourceTurn: 1,
    };
  }

  const scoreSnapshot = computeScoreSnapshotFromConfirmedSlots(scoreSlotStates);
  const hintIncludesSelectedSlot =
    turnBuilt.selected_slot_id === null
      ? true
      : turnAnswer.possible_slot_hints.some((hint) => hint.slot_id === turnBuilt.selected_slot_id);

  console.log(
    JSON.stringify(
      {
        opening,
        nextCategoryId,
        candidateSlotIds: candidateSlots.map((slot) => slot.slot_id),
        turnBuilt,
        parserInput,
        turnAnswer,
        checks: {
          flow_completed: true,
          selected_slot_passed_to_parser_ok:
            parserInput.selected_slot_id === turnBuilt.selected_slot_id,
          selected_slot_hint_alignment_ok: hintIncludesSelectedSlot,
        },
        scoreSnapshot,
      },
      null,
      2,
    ),
  );
}

void main();
