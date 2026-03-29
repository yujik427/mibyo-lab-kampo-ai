import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { CATEGORY_IDS } from "@/lib/kanpo/categoryRegistry";
import {
  adaptChiefComplaintQuestionText,
  inferChiefComplaintCategoryHints,
} from "@/lib/kanpo/chief-complaint-hints";
import {
  buildTurnAnswerSummary,
  isLowSignalTurnAnswerSummary,
} from "@/lib/kanpo/turn-answer-summary";
import {
  buildDefaultTurnFeedback,
  getTurnFeedbackStyle,
  normalizeTurnFeedback,
} from "@/lib/kanpo/turn-feedback";
import { SCORE_SLOT_IDS, SCORE_SLOTS_BY_CATEGORY } from "@/lib/kanpo/slotRegistry";
import type {
  AnswerParserInput,
  AnswerParserResult,
  CategoryId,
  ChiefComplaintCategoryHint,
  ConfidenceLevel,
  FinalReportInput,
  OpeningIntakeAnswerParserInput,
  OpeningIntakeAnswerParserResult,
  ParsedAnswer,
  PossibleSlotHint,
  QuestionId,
  ScoreSlotId,
  TurnBuilderInput,
  TurnBuilderResult,
  TurnAnswerParserInput,
  TurnAnswerParserResult,
} from "@/lib/kanpo/types";

interface ChatTurnInput {
  question_number: number;
  question_text: string;
  options: string[];
  previous_answer_summary: string;
  previous_feedback_hint: string;
}

interface LegacyAnswerParserInput {
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

function normalizeConfidence(value: unknown): ConfidenceLevel {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
}

function clampSelectedOption(value: unknown) {
  return Math.max(0, Math.min(4, Number(value ?? 0))) as 0 | 1 | 2 | 3 | 4;
}

function normalizeCategoryId(value: unknown): CategoryId | null {
  return typeof value === "string" && CATEGORY_IDS.includes(value as CategoryId)
    ? (value as CategoryId)
    : null;
}

function normalizeChiefComplaintHints(value: unknown): ChiefComplaintCategoryHint[] {
  if (!Array.isArray(value)) return [];

  const deduped = new Set<ChiefComplaintCategoryHint>();

  for (const item of value) {
    const categoryId = normalizeCategoryId(item);
    if (!categoryId || categoryId === "safety_check") continue;
    deduped.add(categoryId);
    if (deduped.size >= 3) break;
  }

  return [...deduped];
}

function getAllowedSlotIds(input: TurnAnswerParserInput) {
  const explicitAllowed = Array.isArray(input.allowed_slot_ids)
    ? input.allowed_slot_ids.filter((slotId): slotId is ScoreSlotId =>
        SCORE_SLOT_IDS.includes(slotId),
      )
    : [];

  if (explicitAllowed.length > 0) {
    return explicitAllowed;
  }

  if (input.selected_category_id && input.selected_category_id !== "safety_check") {
    return SCORE_SLOTS_BY_CATEGORY[input.selected_category_id].map((slot) => slot.id);
  }

  return [...SCORE_SLOT_IDS];
}

function normalizePossibleSlotHints(
  value: unknown,
  input: TurnAnswerParserInput,
): PossibleSlotHint[] {
  if (input.selected_category_id === "safety_check") return [];
  if (!Array.isArray(value)) return [];

  const allowedSlotIds = new Set(getAllowedSlotIds(input));
  const results: PossibleSlotHint[] = [];
  const seen = new Set<ScoreSlotId>();

  for (const item of value) {
    if (!item || typeof item !== "object") continue;

    const slotId = (item as { slot_id?: unknown }).slot_id;
    if (typeof slotId !== "string" || !allowedSlotIds.has(slotId as ScoreSlotId)) continue;
    if (seen.has(slotId as ScoreSlotId)) continue;

    results.push({
      slot_id: slotId as ScoreSlotId,
      confidence: normalizeConfidence((item as { confidence?: unknown }).confidence),
      reason:
        typeof (item as { reason?: unknown }).reason === "string" &&
        (item as { reason: string }).reason.trim()
          ? (item as { reason: string }).reason.trim()
          : "質問文と回答内容に整合する可能性があるため",
    });

    seen.add(slotId as ScoreSlotId);
    if (results.length >= 3) break;
  }

  if (
    input.selected_slot_id &&
    allowedSlotIds.has(input.selected_slot_id) &&
    !seen.has(input.selected_slot_id)
  ) {
    results.unshift({
      slot_id: input.selected_slot_id,
      confidence: "medium",
      reason: "selected_slot_id を優先候補として補完しました。",
    });
  }

  return results.slice(0, 3);
}

function buildOpeningIntakeFallback(
  input: OpeningIntakeAnswerParserInput,
): OpeningIntakeAnswerParserResult {
  const chiefComplaintSummary = input.user_message.trim();

  return {
    mode: "opening_intake",
    chief_complaint_summary: chiefComplaintSummary,
    chief_complaint_category_hints: inferChiefComplaintCategoryHints(chiefComplaintSummary),
    red_flag_hint: false,
    red_flag_reason: "",
  };
}

function buildTurnAnswerFallback(
  input: TurnAnswerParserInput,
): TurnAnswerParserResult {
  const fallbackSummary = buildTurnAnswerSummary({
    selectedOption: input.selected_option,
    optionalNote: input.optional_note,
    selectedSlotId: input.selected_slot_id,
    selectedCategoryId: input.selected_category_id,
    questionText: input.question_text,
  });
  const preferredSlotId =
    input.selected_slot_id && SCORE_SLOT_IDS.includes(input.selected_slot_id)
      ? input.selected_slot_id
      : getAllowedSlotIds(input)[0] ?? null;

  return {
    mode: "turn_answer",
    selected_option: clampSelectedOption(input.selected_option),
    free_text_summary: fallbackSummary,
    red_flag_hint: false,
    red_flag_reason: "",
    confidence: input.optional_note?.trim() ? "high" : "medium",
    possible_slot_hints: preferredSlotId
      ? [
          {
            slot_id: preferredSlotId,
            confidence: input.optional_note?.trim() ? "high" : "medium",
            reason: "selected_slot_id を優先候補として扱うローカルフォールバックです。",
          },
        ]
      : [],
  };
}

function buildTurnBuilderFallback(input: TurnBuilderInput): TurnBuilderResult {
  const selectedSlot = input.candidate_slots[0] ?? null;
  return {
    feedback: buildDefaultTurnFeedback({
      selectedCategoryId: input.selected_category_id,
      categoryLabel: input.category_label,
      chiefComplaintSummary: input.chief_complaint_summary,
      previousAnswerSummary: input.previous_answer_summary,
    }),
    question_text:
      selectedSlot?.canonical_question_text ??
      "ここで安全面だけ確認したいです。強い痛みや急な悪化などはありませんか？",
    options: input.options,
    selected_category_id: input.selected_category_id,
    selected_slot_id: selectedSlot?.slot_id ?? null,
    optional_note_hint:
      selectedSlot?.optional_note_hint ?? "気になることがあれば任意で書いてください。",
  };
}

function normalizeTurnBuilderResult(
  parsed: Partial<TurnBuilderResult>,
  input: TurnBuilderInput,
): TurnBuilderResult {
  const allowedSlotIds = new Set(input.candidate_slots.map((slot) => slot.slot_id));
  const fallbackSlotId =
    input.selected_category_id === "safety_check"
      ? null
      : input.candidate_slots[0]?.slot_id ?? null;

  const selectedSlotId =
    typeof parsed.selected_slot_id === "string" &&
    allowedSlotIds.has(parsed.selected_slot_id as ScoreSlotId)
      ? (parsed.selected_slot_id as ScoreSlotId)
      : fallbackSlotId;

  const selectedSlot = input.candidate_slots.find((slot) => slot.slot_id === selectedSlotId) ?? null;
  const promptContext = {
    selectedCategoryId: input.selected_category_id,
    categoryLabel: input.category_label,
    chiefComplaintSummary: input.chief_complaint_summary,
    previousAnswerSummary: input.previous_answer_summary,
  };

  return {
    feedback: normalizeTurnFeedback(parsed.feedback, promptContext),
    question_text: adaptChiefComplaintQuestionText({
      chiefComplaintSummary: input.chief_complaint_summary,
      selectedCategoryId: input.selected_category_id,
      selectedSlotId,
      questionText:
        typeof parsed.question_text === "string" && parsed.question_text.trim()
          ? parsed.question_text.trim()
          : selectedSlot?.canonical_question_text ??
            "ここで安全面だけ確認したいです。強い痛みや急な悪化などはありませんか？",
    }),
    options:
      Array.isArray(parsed.options) &&
      parsed.options.length === input.options.length &&
      parsed.options.every((option) => typeof option === "string")
        ? parsed.options
        : input.options,
    selected_category_id: input.selected_category_id,
    selected_slot_id: selectedSlotId,
    optional_note_hint:
      typeof parsed.optional_note_hint === "string" && parsed.optional_note_hint.trim()
        ? parsed.optional_note_hint.trim()
        : selectedSlot?.optional_note_hint ?? "気になることがあれば任意で書いてください。",
  };
}

function normalizeOpeningIntakeResult(
  parsed: Partial<OpeningIntakeAnswerParserResult>,
  input: OpeningIntakeAnswerParserInput,
): OpeningIntakeAnswerParserResult {
  return {
    mode: "opening_intake",
    chief_complaint_summary:
      typeof parsed.chief_complaint_summary === "string" &&
      parsed.chief_complaint_summary.trim()
        ? parsed.chief_complaint_summary.trim()
        : input.user_message.trim(),
    chief_complaint_category_hints: normalizeChiefComplaintHints(
      parsed.chief_complaint_category_hints,
    ),
    red_flag_hint: Boolean(parsed.red_flag_hint),
    red_flag_reason:
      typeof parsed.red_flag_reason === "string" ? parsed.red_flag_reason : "",
  };
}

function normalizeTurnAnswerResult(
  parsed: Partial<TurnAnswerParserResult>,
  input: TurnAnswerParserInput,
): TurnAnswerParserResult {
  const fallbackSummary = buildTurnAnswerSummary({
    selectedOption: input.selected_option,
    optionalNote: input.optional_note,
    selectedSlotId: input.selected_slot_id,
    selectedCategoryId: input.selected_category_id,
    questionText: input.question_text,
  });
  const parsedSummary =
    typeof parsed.free_text_summary === "string" ? parsed.free_text_summary.trim() : "";

  return {
    mode: "turn_answer",
    selected_option: clampSelectedOption(parsed.selected_option ?? input.selected_option),
    free_text_summary:
      parsedSummary && !isLowSignalTurnAnswerSummary(parsedSummary)
        ? parsedSummary
        : fallbackSummary,
    red_flag_hint: Boolean(parsed.red_flag_hint),
    red_flag_reason:
      typeof parsed.red_flag_reason === "string" ? parsed.red_flag_reason : "",
    confidence: normalizeConfidence(parsed.confidence),
    possible_slot_hints: normalizePossibleSlotHints(parsed.possible_slot_hints, input),
  };
}

export async function runAnswerParser(
  input: AnswerParserInput,
): Promise<AnswerParserResult> {
  try {
    const outputText = await requestOpenAIResponse({
      modelEnvKey: "OPENAI_MODEL_ANSWER_PARSER",
      promptFileName: "answer-parser.md",
      inputPayload: input,
    });

    const parsed = JSON.parse(stripCodeFence(outputText)) as
      | Partial<OpeningIntakeAnswerParserResult>
      | Partial<TurnAnswerParserResult>;

    return input.mode === "opening_intake"
      ? normalizeOpeningIntakeResult(
          parsed as Partial<OpeningIntakeAnswerParserResult>,
          input,
        )
      : normalizeTurnAnswerResult(parsed as Partial<TurnAnswerParserResult>, input);
  } catch {
    return input.mode === "opening_intake"
      ? buildOpeningIntakeFallback(input)
      : buildTurnAnswerFallback(input);
  }
}

export async function buildTurnBuilder(
  input: TurnBuilderInput,
): Promise<TurnBuilderResult> {
  try {
    const outputText = await requestOpenAIResponse({
      modelEnvKey: "OPENAI_MODEL_TURN_BUILDER",
      promptFileName:
        getTurnFeedbackStyle() === "classic"
          ? "turn-builder-classic.md"
          : "turn-builder.md",
      inputPayload: input,
    });

    const parsed = JSON.parse(stripCodeFence(outputText)) as Partial<TurnBuilderResult>;
    return normalizeTurnBuilderResult(parsed, input);
  } catch {
    return buildTurnBuilderFallback(input);
  }
}

function extractSelectedOptionFromLegacyMessage(message: string, options: string[]) {
  const trimmed = message.trim();
  const fromPrefix = trimmed.match(/^([0-4])(?:\s|$|[:：])/);
  if (fromPrefix) return clampSelectedOption(Number(fromPrefix[1]));

  const directIndex = options.findIndex((option) => option.trim() === trimmed);
  if (directIndex >= 0 && directIndex <= 4) return clampSelectedOption(directIndex);

  return 0;
}

function extractOptionalNoteFromLegacyMessage(message: string, options: string[]) {
  const trimmed = message.trim();
  if (!trimmed) return "";
  if (options.some((option) => option.trim() === trimmed)) return "";

  const normalized = trimmed.replace(/^\s*[0-4](?:\s|$|[:：])/, "").trim();
  return options.some((option) => option.trim() === normalized) ? "" : normalized;
}

export async function parseAnswer(input: LegacyAnswerParserInput): Promise<ParsedAnswer> {
  const selectedOption = extractSelectedOptionFromLegacyMessage(input.user_message, input.options);
  const optionalNote = extractOptionalNoteFromLegacyMessage(input.user_message, input.options);

  const parsed = await runAnswerParser({
    mode: "turn_answer",
    question_text: input.question_text,
    selected_option: selectedOption,
    optional_note: optionalNote,
    selected_slot_id: null,
  });

  return {
    question_id: input.question_id,
    selected_option: parsed.mode === "turn_answer" ? parsed.selected_option : selectedOption,
    free_text_summary:
      parsed.mode === "turn_answer"
        ? parsed.free_text_summary
        : input.user_message.trim(),
    red_flag_hint: parsed.mode === "turn_answer" ? parsed.red_flag_hint : false,
    red_flag_reason: parsed.mode === "turn_answer" ? parsed.red_flag_reason : "",
    confidence: parsed.mode === "turn_answer" ? parsed.confidence : "medium",
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
