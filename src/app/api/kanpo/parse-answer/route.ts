import { NextRequest, NextResponse } from "next/server";
import { parseAnswer } from "@/lib/openai/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      question_id?: string;
      question_text?: string;
      options?: string[];
      user_message?: string;
    };

    if (
      !body.question_id ||
      !body.question_text ||
      !Array.isArray(body.options) ||
      !body.user_message
    ) {
      return NextResponse.json({ error: "Invalid parse-answer payload" }, { status: 400 });
    }

    const parsed = await parseAnswer({
      question_id: body.question_id as never,
      question_text: body.question_text,
      options: body.options,
      user_message: body.user_message,
    });

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to parse answer",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
