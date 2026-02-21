import { NextRequest, NextResponse } from "next/server";

interface DifyChatRequest {
  query: string;
  inputs?: Record<string, unknown>;
  conversation_id?: string;
  user: string;
}

export async function handleDifyChatRequest(
  req: NextRequest,
  apiKeyEnvVar: string,
) {
  try {
    const body = await req.json();
    const { query, inputs, conversation_id, user } = body as DifyChatRequest;

    if (!query || !user) {
      return NextResponse.json(
        { error: "query and user are required" },
        { status: 400 },
      );
    }

    const difyBaseUrl = process.env.DIFY_BASE_URL || "https://api.dify.ai";
    const difyApiKey = process.env[apiKeyEnvVar];

    if (!difyApiKey) {
      return NextResponse.json(
        { error: `${apiKeyEnvVar} is not configured` },
        { status: 500 },
      );
    }

    const response = await fetch(`${difyBaseUrl}/v1/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: inputs ?? {},
        query,
        response_mode: "blocking",
        conversation_id: conversation_id ?? "",
        user,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Dify API error", status: response.status, detail: errorText },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dify API route error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
