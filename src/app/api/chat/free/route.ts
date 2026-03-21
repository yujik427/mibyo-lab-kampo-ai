import { NextRequest } from "next/server";
import { handleDifyChatRequest } from "@/lib/dify-client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleDifyChatRequest(req, "DIFY_API_KEY_DIAG");
}
