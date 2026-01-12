import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, inputs, conversation_id, user } = body;

    // query と user がない場合は 400
    if (!query || !user) {
      return NextResponse.json(
        { error: 'query and user are required' },
        { status: 400 }
      );
    }

    // Dify API の設定
    const difyBaseUrl = process.env.DIFY_BASE_URL || 'https://api.dify.ai';
    const difyApiKey = process.env.DIFY_API_KEY;

    if (!difyApiKey) {
      return NextResponse.json(
        { error: 'DIFY_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Difyへ中継
    const response = await fetch(`${difyBaseUrl}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: inputs ?? {},
        query,
        response_mode: 'blocking',
        conversation_id: conversation_id ?? '',
        user,
      }),
    });

    // Difyが !ok の場合
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: 'Dify API error',
          status: response.status,
          detail: errorText,
        },
        { status: 502 }
      );
    }

    // ok の場合：DifyのレスポンスJSONをそのまま返す
    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


