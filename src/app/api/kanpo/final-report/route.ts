import { NextRequest, NextResponse } from "next/server";
import { buildFinalReport } from "@/lib/openai/client";
import type { FinalReportInput } from "@/lib/kanpo/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<FinalReportInput>;

    if (
      !body.main_scores ||
      !body.sub_scores ||
      !body.body_labels ||
      !body.answer_summary ||
      !body.candidate_formulas
    ) {
      return NextResponse.json({ error: "Invalid final-report payload" }, { status: 400 });
    }

    const content = await buildFinalReport(body as FinalReportInput);
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to build final report",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
