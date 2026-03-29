import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_IDS } from "@/lib/kanpo/categoryRegistry";
import { SCORE_SLOT_IDS } from "@/lib/kanpo/slotRegistry";
import { runAnswerParser } from "@/lib/openai/client";
import type { AnswerParserInput, CategoryId, ScoreSlotId } from "@/lib/kanpo/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      mode?: string;
      user_message?: string;
      selected_category_id?: string;
      selected_slot_id?: string | null;
      question_text?: string;
      selected_option?: number;
      optional_note?: string;
      allowed_slot_ids?: string[];
    };

    let input: AnswerParserInput;

    if (body.mode === "opening_intake") {
      if (!body.user_message) {
        return NextResponse.json(
          { error: "opening_intake requires user_message" },
          { status: 400 },
        );
      }

      input = {
        mode: "opening_intake",
        user_message: body.user_message,
      };
    } else if (body.mode === "turn_answer") {
      if (
        !body.selected_category_id ||
        !body.question_text ||
        typeof body.selected_option !== "number"
      ) {
        return NextResponse.json(
          {
            error:
              "turn_answer requires selected_category_id, question_text, and selected_option",
          },
          { status: 400 },
        );
      }

      if (!CATEGORY_IDS.includes(body.selected_category_id as CategoryId)) {
        return NextResponse.json(
          { error: "selected_category_id is invalid" },
          { status: 400 },
        );
      }

      if (
        body.selected_slot_id !== undefined &&
        body.selected_slot_id !== null &&
        !SCORE_SLOT_IDS.includes(body.selected_slot_id as ScoreSlotId)
      ) {
        return NextResponse.json(
          { error: "selected_slot_id is invalid" },
          { status: 400 },
        );
      }

      input = {
        mode: "turn_answer",
        selected_category_id: body.selected_category_id as CategoryId,
        selected_slot_id:
          typeof body.selected_slot_id === "string"
            ? (body.selected_slot_id as ScoreSlotId)
            : null,
        question_text: body.question_text,
        selected_option: body.selected_option,
        optional_note: typeof body.optional_note === "string" ? body.optional_note : "",
        allowed_slot_ids: Array.isArray(body.allowed_slot_ids)
          ? (body.allowed_slot_ids as ScoreSlotId[])
          : undefined,
      };
    } else {
      return NextResponse.json(
        { error: "mode must be opening_intake or turn_answer" },
        { status: 400 },
      );
    }

    const parsed = await runAnswerParser(input);
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to run answer-parser",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
