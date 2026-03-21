import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FinalReportInput, ParsedAnswer, QuestionId } from "@/lib/kanpo/types";

interface ChatTurnInput {
  question_number: number;
  question_text: string;
  options: string[];
  previous_answer_summary: string;
  previous_feedback_hint: string;
}

interface AnswerParserInput {
  question_id: QuestionId;
  question_text: string;
  options: string[];
  user_message: string;
}

function getApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return apiKey;
}

function getModel(envKey: string) {
  const model = process.env[envKey] || process.env.OPENAI_MODEL;
  if (!model) {
    throw new Error(`${envKey} or OPENAI_MODEL is not configured`);
  }
  return model;
}

async function readPromptFile(fileName: string) {
  const promptPath = path.join(process.cwd(), "prompts", fileName);
  return readFile(promptPath, "utf8");
}

function extractOutputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputs = Array.isArray(payload.output) ? payload.output : [];
  const fragments = outputs.flatMap((output) => {
    if (!output || typeof output !== "object") return [];
    const content = Array.isArray((output as { content?: unknown }).content)
      ? ((output as { content: unknown[] }).content ?? [])
      : [];

    return content
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const candidate =
          (item as { text?: unknown }).text ??
          (item as { output_text?: unknown }).output_text ??
          (item as { value?: unknown }).value;
        return typeof candidate === "string" ? candidate : "";
      })
      .filter(Boolean);
  });

  return fragments.join("\n").trim();
}

async function requestOpenAIResponse(args: {
  modelEnvKey: string;
  promptFileName: string;
  inputPayload: unknown;
}) {
  const systemPrompt = await readPromptFile(args.promptFileName);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(args.modelEnvKey),
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(args.inputPayload, null, 2),
            },
          ],
        },
      ],
    }),
  });

  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const detail =
      extractOutputText(payload) ||
      (typeof payload.error === "object" &&
      payload.error &&
      typeof (payload.error as { message?: unknown }).message === "string"
        ? (payload.error as { message: string }).message
        : "");

    throw new Error(detail || `OpenAI Responses API error: ${response.status}`);
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error("OpenAI response was empty");
  }

  return outputText;
}

function stripCodeFence(text: string) {
  return text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

function normalizeConfidence(value: unknown): ParsedAnswer["confidence"] {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
}

export async function parseAnswer(input: AnswerParserInput): Promise<ParsedAnswer> {
  const outputText = await requestOpenAIResponse({
    modelEnvKey: "OPENAI_MODEL_ANSWER_PARSER",
    promptFileName: "answer-parser.md",
    inputPayload: input,
  });

  const parsed = JSON.parse(stripCodeFence(outputText)) as Partial<ParsedAnswer>;

  return {
    question_id: input.question_id,
    selected_option: Math.max(0, Math.min(4, Number(parsed.selected_option ?? 0))),
    free_text_summary:
      typeof parsed.free_text_summary === "string"
        ? parsed.free_text_summary
        : input.user_message.trim(),
    red_flag_hint: Boolean(parsed.red_flag_hint),
    red_flag_reason:
      typeof parsed.red_flag_reason === "string" ? parsed.red_flag_reason : "",
    confidence: normalizeConfidence(parsed.confidence),
  };
}

export async function buildTurnFeedback(input: ChatTurnInput) {
  return requestOpenAIResponse({
    modelEnvKey: "OPENAI_MODEL_CHAT_TURN",
    promptFileName: "chat-turn.md",
    inputPayload: input,
  });
}

export async function buildFinalReport(input: FinalReportInput) {
  return requestOpenAIResponse({
    modelEnvKey: "OPENAI_MODEL_FINAL_REPORT",
    promptFileName: "final-report.md",
    inputPayload: input,
  });
}
