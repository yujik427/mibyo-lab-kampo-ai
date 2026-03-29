import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_IDS, getCategoryDefinition } from "@/lib/kanpo/categoryRegistry";
import { SCORE_SLOT_IDS } from "@/lib/kanpo/slotRegistry";
import { buildTurnBuilder } from "@/lib/openai/client";
import type { CategoryId, ScoreSlotId, TurnBuilderInput } from "@/lib/kanpo/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TurnBuilderInput>;

    if (
      typeof body.turn_index !== "number" ||
      !body.selected_category_id ||
      !CATEGORY_IDS.includes(body.selected_category_id as CategoryId)
    ) {
      return NextResponse.json(
        { error: "turn_index and valid selected_category_id are required" },
        { status: 400 },
      );
    }

    const categoryId = body.selected_category_id as CategoryId;
    const category = getCategoryDefinition(categoryId);
    const candidateSlots = Array.isArray(body.candidate_slots)
      ? body.candidate_slots.filter(
          (slot): slot is NonNullable<TurnBuilderInput["candidate_slots"]>[number] =>
            !!slot &&
            typeof slot === "object" &&
            typeof slot.slot_id === "string" &&
            SCORE_SLOT_IDS.includes(slot.slot_id as ScoreSlotId),
        )
      : [];

    if (categoryId !== "safety_check" && candidateSlots.length === 0) {
      return NextResponse.json(
        { error: "candidate_slots are required for non-safety categories" },
        { status: 400 },
      );
    }

    const input: TurnBuilderInput = {
      turn_index: body.turn_index,
      selected_category_id: categoryId,
      category_label:
        typeof body.category_label === "string" && body.category_label.trim()
          ? body.category_label
          : category.label,
      category_description:
        typeof body.category_description === "string" && body.category_description.trim()
          ? body.category_description
          : category.description,
      chief_complaint_summary:
        typeof body.chief_complaint_summary === "string" ? body.chief_complaint_summary : "",
      previous_answer_summary:
        typeof body.previous_answer_summary === "string" ? body.previous_answer_summary : "",
      previous_feedback_hint:
        typeof body.previous_feedback_hint === "string" ? body.previous_feedback_hint : "",
      answer_mode: "scale_0_4_with_optional_note",
      options:
        Array.isArray(body.options) && body.options.every((option) => typeof option === "string")
          ? body.options
          : [
              "0 まったくない",
              "1 ほとんどない",
              "2 ときどきある",
              "3 よくある",
              "4 ほぼ毎日ある",
            ],
      candidate_slots: candidateSlots,
    };

    const result = await buildTurnBuilder(input);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to build turn question",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
