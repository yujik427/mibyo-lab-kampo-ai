import { NextRequest, NextResponse } from "next/server";
import { buildTurnFeedback } from "@/lib/openai/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      question_number?: number;
      question_text?: string;
      options?: string[];
      previous_answer_summary?: string;
      previous_feedback_hint?: string;
    };

    if (
      typeof body.question_number !== "number" ||
      !body.question_text ||
      !Array.isArray(body.options)
    ) {
      return NextResponse.json({ error: "Invalid chat-turn payload" }, { status: 400 });
    }

    const content = await buildTurnFeedback({
      question_number: body.question_number,
      question_text: body.question_text,
      options: body.options,
      previous_answer_summary: body.previous_answer_summary ?? "",
      previous_feedback_hint: body.previous_feedback_hint ?? "",
    });

    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to build turn feedback",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
