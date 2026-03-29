"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BodyTypeFigure } from "@/components/kanpo/BodyTypeFigure";
import { FinalReport } from "@/components/kanpo/FinalReport";
import { OpeningIntakeCard } from "@/components/kanpo/OpeningIntakeCard";
import { ProgressHeader } from "@/components/kanpo/ProgressHeader";
import { QuestionCard } from "@/components/kanpo/QuestionCard";
import { RadarChart } from "@/components/kanpo/RadarChart";
import { ResultSummary } from "@/components/kanpo/ResultSummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  INTERVIEW_MAX_TURNS,
  getCategoryDefinition,
} from "@/lib/kanpo/categoryRegistry";
import {
  DEFAULT_KANPO_SESSION,
  buildQuestionProgress,
  getKanpoSessionStorageKey,
  getNextQuestionIndex,
  isKanpoConversationComplete,
} from "@/lib/kanpo/conversationEngine";
import { buildFormulaPool } from "@/lib/kanpo/formulaPool";
import {
  adaptChiefComplaintQuestionText,
  inferChiefComplaintCategoryHints,
} from "@/lib/kanpo/chief-complaint-hints";
import { buildBodyLabels } from "@/lib/kanpo/labelEngine";
import { buildFallbackFinalReport, buildFinalReportInput } from "@/lib/kanpo/reportBuilder";
import { buildTurnBuilderSlotCandidates, getScoreSlotDefinition, SCORE_SLOT_IDS } from "@/lib/kanpo/slotRegistry";
import { buildTurnAnswerSummary } from "@/lib/kanpo/turn-answer-summary";
import { buildDefaultTurnFeedback } from "@/lib/kanpo/turn-feedback";
import { evaluateRedFlagsFromTexts } from "@/lib/kanpo/redFlagRules";
import { computeScoreSnapshotFromConfirmedSlots } from "@/lib/kanpo/scoreEngine";
import { selectNextCategoryId } from "@/lib/kanpo/turnController";
import type {
  AnswerItem,
  CategoryId,
  ChiefComplaintCategoryHint,
  CurrentTurnState,
  KanpoSessionSnapshot,
  KanpoSessionState,
  OpeningIntakeAnswerParserResult,
  SafetyCheckState,
  ScoreSlotId,
  ScoreSlotState,
  TurnAnswerParserResult,
  TurnBuilderResult,
} from "@/lib/kanpo/types";

const DEFAULT_OPTIONS = [
  "0 まったくない",
  "1 ほとんどない",
  "2 ときどきある",
  "3 よくある",
  "4 ほぼ毎日ある",
] as const;
const SAFETY_CHECK_OPTIONS = [
  "0 特にありません",
  "1 ほとんど気になりません",
  "2 少し気になる症状があります",
  "3 かなり気になる症状があります",
  "4 早めに相談したい症状があります",
] as const;

const INITIAL_FEEDBACK =
  "まずは今いちばん気になっている不調を自由に書いてください。そこから、次に何を整理するかを一緒に決めていきます。";
const COMPLETION_FEEDBACK =
  "20ターンの体質整理が完了しました。最後に安全面だけ確認してから、全体のレポートをまとめます。";
const FINAL_REPORT_READY_FEEDBACK =
  "体質整理と安全確認をふまえて、最終レポートをまとめました。無理のない範囲で読み進めてみてください。";

function buildOpeningFallback(message: string): OpeningIntakeAnswerParserResult {
  return {
    mode: "opening_intake",
    chief_complaint_summary: message.trim(),
    chief_complaint_category_hints: inferChiefComplaintCategoryHints(message.trim()),
    red_flag_hint: false,
    red_flag_reason: "",
  };
}

function buildTurnAnswerFallback(args: {
  selectedOption: number;
  optionalNote: string;
  selectedSlotId: ScoreSlotId | null;
  selectedCategoryId: CategoryId;
  questionText: string;
}): TurnAnswerParserResult {
  return {
    mode: "turn_answer",
    selected_option: Math.max(0, Math.min(4, args.selectedOption)) as 0 | 1 | 2 | 3 | 4,
    free_text_summary: buildTurnAnswerSummary({
      selectedOption: args.selectedOption,
      optionalNote: args.optionalNote,
      selectedSlotId: args.selectedSlotId,
      selectedCategoryId: args.selectedCategoryId,
      questionText: args.questionText,
    }),
    red_flag_hint: false,
    red_flag_reason: "",
    confidence: args.optionalNote.trim() ? "high" : "medium",
    possible_slot_hints: args.selectedSlotId
      ? [
          {
            slot_id: args.selectedSlotId,
            confidence: args.optionalNote.trim() ? "high" : "medium",
            reason: "selected_slot_id を優先候補として扱うローカルフォールバックです。",
          },
        ]
      : [],
  };
}

function buildFeedbackHint(args: {
  confirmedCount: number;
  totalSlots: number;
  bodyLabels: ReturnType<typeof buildBodyLabels>;
}) {
  if (args.confirmedCount === 0) {
    return "問診開始直後のため、まだ体質傾向は暫定です。";
  }

  return `確定${args.confirmedCount}/${args.totalSlots}、虚実=${args.bodyLabels.kyojitsu}、寒熱=上${args.bodyLabels.upperTemperature}/下${args.bodyLabels.lowerTemperature}、燥湿=上${args.bodyLabels.upperTexture}/下${args.bodyLabels.lowerTexture}`;
}

function buildCurrentTurn(args: {
  turnNumber: number;
  result: TurnBuilderResult;
  candidateSlotIds: ScoreSlotId[];
}): CurrentTurnState {
  return {
    phase: "main",
    displayLabel: `質問 ${args.turnNumber}`,
    turnNumber: args.turnNumber,
    selectedCategoryId: args.result.selected_category_id,
    selectedSlotId: args.result.selected_slot_id,
    feedback: args.result.feedback,
    questionText: args.result.question_text,
    options: args.result.options,
    optionalNoteHint: args.result.optional_note_hint,
    candidateSlotIds: args.candidateSlotIds,
  };
}

function buildSafetyCheckTurn(): CurrentTurnState {
  return {
    phase: "safety_check",
    displayLabel: "安全確認（20ターン外）",
    turnNumber: INTERVIEW_MAX_TURNS,
    selectedCategoryId: "safety_check",
    selectedSlotId: null,
    feedback:
      "20ターンの体質整理はここで完了です。最後に、安全面だけ短く確認してから最終レポートをまとめます。",
    questionText:
      "最後に安全面だけ確認させてください。ここ2週間で、強い痛み・急な悪化・出血・高熱・息苦しさ・意識が遠のく感じなど、早めに医療機関へ相談したい症状はありましたか。",
    options: [...SAFETY_CHECK_OPTIONS],
    optionalNoteHint:
      "気になる症状があれば、いつから・どんな変化かを任意で書いてください。",
    candidateSlotIds: [],
  };
}

function buildTurnBuilderFallback(args: {
  turnNumber: number;
  selectedCategoryId: CategoryId;
  chiefComplaintSummary: string;
  candidateSlotIds: ScoreSlotId[];
}) {
  const selectedSlotId = args.candidateSlotIds[0] ?? null;
  const slot = selectedSlotId ? getScoreSlotDefinition(selectedSlotId) : null;

  return buildCurrentTurn({
    turnNumber: args.turnNumber,
    candidateSlotIds: args.candidateSlotIds,
    result: {
      feedback: buildDefaultTurnFeedback({
        selectedCategoryId: args.selectedCategoryId,
        categoryLabel: getCategoryDefinition(args.selectedCategoryId).label,
        chiefComplaintSummary: args.chiefComplaintSummary,
        previousAnswerSummary: "",
      }),
      question_text:
        slot
          ? adaptChiefComplaintQuestionText({
              chiefComplaintSummary: args.chiefComplaintSummary,
              selectedCategoryId: args.selectedCategoryId,
              selectedSlotId,
              questionText: slot.canonicalQuestionText,
            })
          : "ここで安全面だけ確認したいです。強い痛みや急な悪化などはありませんか？",
      options: [...DEFAULT_OPTIONS],
      selected_category_id: args.selectedCategoryId,
      selected_slot_id: selectedSlotId,
      optional_note_hint:
        slot?.optionalNoteHint ?? "気になることがあれば任意で書いてください。",
    },
  });
}

function upsertAnswerRecord(answers: AnswerItem[], nextAnswer: AnswerItem) {
  const existingIndex = answers.findIndex((answer) => answer.questionId === nextAnswer.questionId);
  if (existingIndex === -1) return [...answers, nextAnswer];

  const copied = [...answers];
  copied[existingIndex] = nextAnswer;
  return copied;
}

function getFriendlyFinalReportFallbackMessage() {
  return "AI最終レポートを利用できなかったため、ローカルfallbackで最終整理を表示しています。";
}

function toSessionSnapshot(session: KanpoSessionState): KanpoSessionSnapshot {
  const { undoStack: _undoStack, ...snapshot } = session;
  return snapshot;
}

function withUndoSnapshot(
  currentSession: KanpoSessionState,
  nextSession: KanpoSessionSnapshot,
): KanpoSessionState {
  return {
    ...nextSession,
    undoStack: [...currentSession.undoStack, toSessionSnapshot(currentSession)].slice(-30),
  };
}

export default function KanpoChatPage() {
  const [session, setSession] = useState<KanpoSessionState>(DEFAULT_KANPO_SESSION);
  const [isReady, setIsReady] = useState(false);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [turnLoading, setTurnLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(getKanpoSessionStorageKey());
      if (!raw) {
        setIsReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<KanpoSessionState>;
      setSession({
        answers: Array.isArray(parsed.answers) ? parsed.answers : [],
        currentIndex: typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0,
        feedbackHistory: Array.isArray(parsed.feedbackHistory) ? parsed.feedbackHistory : [],
        finalReportText: typeof parsed.finalReportText === "string" ? parsed.finalReportText : "",
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
        chiefComplaintInput:
          typeof parsed.chiefComplaintInput === "string" ? parsed.chiefComplaintInput : "",
        chiefComplaintSummary:
          typeof parsed.chiefComplaintSummary === "string" ? parsed.chiefComplaintSummary : "",
        chiefComplaintCategoryHints: Array.isArray(parsed.chiefComplaintCategoryHints)
          ? (parsed.chiefComplaintCategoryHints as ChiefComplaintCategoryHint[])
          : [],
        scoreSlotStates:
          parsed.scoreSlotStates && typeof parsed.scoreSlotStates === "object"
            ? (parsed.scoreSlotStates as Partial<Record<ScoreSlotId, ScoreSlotState>>)
            : {},
        lastCategoryId:
          typeof parsed.lastCategoryId === "string" ? (parsed.lastCategoryId as CategoryId) : null,
        currentTurn:
          parsed.currentTurn && typeof parsed.currentTurn === "object"
            ? (parsed.currentTurn as CurrentTurnState)
            : null,
        safetyCheck:
          parsed.safetyCheck && typeof parsed.safetyCheck === "object"
            ? (parsed.safetyCheck as SafetyCheckState)
            : null,
        freeTextHistory: Array.isArray(parsed.freeTextHistory) ? parsed.freeTextHistory : [],
        undoStack: Array.isArray(parsed.undoStack)
          ? (parsed.undoStack as KanpoSessionSnapshot[])
          : [],
      });
    } catch {
      setSession(DEFAULT_KANPO_SESSION);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return;
    window.localStorage.setItem(getKanpoSessionStorageKey(), JSON.stringify(session));
  }, [isReady, session]);

  const isComplete = isKanpoConversationComplete(session.currentIndex);
  const intakeCompleted = session.chiefComplaintSummary.trim().length > 0;
  const progress = intakeCompleted
    ? buildQuestionProgress(session.currentIndex)
    : { current: 0, total: INTERVIEW_MAX_TURNS, percent: 0 };
  const confirmedCount = useMemo(
    () =>
      Object.values(session.scoreSlotStates).filter((state) => state?.status === "confirmed")
        .length,
    [session.scoreSlotStates],
  );
  const tentativeCount = useMemo(
    () =>
      Object.values(session.scoreSlotStates).filter((state) => state?.status === "tentative")
        .length,
    [session.scoreSlotStates],
  );
  const totalSlots = SCORE_SLOT_IDS.length;
  const coverageRatio = confirmedCount / totalSlots;
  const visualOpacity = Math.max(0.24, Math.min(1, 0.24 + coverageRatio * 0.76));
  const snapshot = useMemo(
    () => computeScoreSnapshotFromConfirmedSlots(session.scoreSlotStates),
    [session.scoreSlotStates],
  );
  const bodyLabels = useMemo(
    () => buildBodyLabels(snapshot.bodyFigureValues),
    [snapshot.bodyFigureValues],
  );
  const candidateFormulas = useMemo(
    () => buildFormulaPool(snapshot.mainScores, snapshot.subScores),
    [snapshot.mainScores, snapshot.subScores],
  );
  const redFlags = useMemo(
    () =>
      evaluateRedFlagsFromTexts(
        [
          session.chiefComplaintSummary,
          ...session.freeTextHistory,
          session.safetyCheck?.rawMessage ?? "",
          session.safetyCheck?.freeTextSummary ?? "",
        ].filter(Boolean),
        session.answers
          .map((answer) => answer.redFlagReason)
          .concat(session.safetyCheck?.redFlagReason ? [session.safetyCheck.redFlagReason] : [])
          .filter((reason) => reason.trim().length > 0),
      ),
    [session.answers, session.chiefComplaintSummary, session.freeTextHistory, session.safetyCheck],
  );
  const latestFeedback = session.currentTurn?.feedback ||
    (session.finalReportText
      ? FINAL_REPORT_READY_FEEDBACK
      : isComplete
        ? COMPLETION_FEEDBACK
        : session.feedbackHistory.at(-1) || INITIAL_FEEDBACK);
  const canUndo = session.undoStack.length > 0 && !intakeLoading && !turnLoading && !reportLoading;

  const requestNextTurn = useCallback(
    async (args: {
      turnNumber: number;
      chiefComplaintSummary: string;
      chiefComplaintCategoryHints: ChiefComplaintCategoryHint[];
      lastCategoryId: CategoryId | null;
      scoreSlotStates: Partial<Record<ScoreSlotId, ScoreSlotState>>;
      previousAnswerSummary: string;
      previousFeedbackHint: string;
    }) => {
      const nextCategoryId = selectNextCategoryId({
        nextTurnNumber: args.turnNumber,
        lastCategoryId: args.lastCategoryId,
        chiefComplaintCategoryHints: args.chiefComplaintCategoryHints,
        scoreSlotStates: args.scoreSlotStates,
      });

      const category = getCategoryDefinition(nextCategoryId);
      const candidateSlots =
        nextCategoryId === "safety_check"
          ? []
          : buildTurnBuilderSlotCandidates({
              categoryId: nextCategoryId,
              chiefComplaintSummary: args.chiefComplaintSummary,
              scoreSlotStates: args.scoreSlotStates,
              limit: 3,
            });
      const candidateSlotIds = candidateSlots.map((slot) => slot.slot_id);

      try {
        const response = await fetch("/api/kanpo/turn-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turn_index: args.turnNumber,
            selected_category_id: nextCategoryId,
            category_label: category.label,
            category_description: category.description,
            chief_complaint_summary: args.chiefComplaintSummary,
            previous_answer_summary: args.previousAnswerSummary,
            previous_feedback_hint: args.previousFeedbackHint,
            answer_mode: "scale_0_4_with_optional_note",
            options: [...DEFAULT_OPTIONS],
            candidate_slots: candidateSlots,
          }),
        });

        if (!response.ok) {
          throw new Error("turn-builder route error");
        }

        const result = (await response.json()) as TurnBuilderResult;
        const alignedResult: TurnBuilderResult = {
          ...result,
          question_text: adaptChiefComplaintQuestionText({
            chiefComplaintSummary: args.chiefComplaintSummary,
            selectedCategoryId: result.selected_category_id,
            selectedSlotId: result.selected_slot_id,
            questionText: result.question_text,
          }),
        };
        return buildCurrentTurn({
          turnNumber: args.turnNumber,
          result: alignedResult,
          candidateSlotIds,
        });
      } catch {
        return buildTurnBuilderFallback({
          turnNumber: args.turnNumber,
          selectedCategoryId: nextCategoryId,
          chiefComplaintSummary: args.chiefComplaintSummary,
          candidateSlotIds,
        });
      }
    },
    [],
  );

  const generateFinalReport = useCallback(
    async (args: {
      answers: AnswerItem[];
      scoreSlotStates: Partial<Record<ScoreSlotId, ScoreSlotState>>;
      chiefComplaintSummary: string;
      safetyCheck: SafetyCheckState;
      freeTextHistory: string[];
    }) => {
      const nextSnapshot = computeScoreSnapshotFromConfirmedSlots(args.scoreSlotStates);
      const nextCandidateFormulas = buildFormulaPool(nextSnapshot.mainScores, nextSnapshot.subScores);
      const nextConfirmedCount = Object.values(args.scoreSlotStates).filter(
        (state) => state?.status === "confirmed",
      ).length;
      const nextRedFlags = evaluateRedFlagsFromTexts(
        [
          args.chiefComplaintSummary,
          ...args.freeTextHistory,
          args.safetyCheck.rawMessage,
          args.safetyCheck.freeTextSummary,
        ].filter(Boolean),
        args.answers
          .map((answer) => answer.redFlagReason)
          .concat(args.safetyCheck.redFlagReason ? [args.safetyCheck.redFlagReason] : [])
          .filter((reason) => reason.trim().length > 0),
      );
      const reportInput = buildFinalReportInput({
        answers: args.answers,
        snapshot: nextSnapshot,
        candidateFormulas: nextCandidateFormulas,
        redFlags: nextRedFlags,
        chiefComplaintSummary: args.chiefComplaintSummary,
        safetyCheckSummary: args.safetyCheck.freeTextSummary || args.safetyCheck.rawMessage,
        confirmedCount: nextConfirmedCount,
        totalSlots,
      });

      setReportLoading(true);
      setReportError(null);

      try {
        const response = await fetch("/api/kanpo/final-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reportInput),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { detail?: string };
          throw new Error(data.detail || "最終レポート生成に失敗しました。");
        }

        const data = (await response.json()) as { content?: string };
        return data.content || buildFallbackFinalReport(reportInput);
      } catch {
        setReportError(getFriendlyFinalReportFallbackMessage());
        return buildFallbackFinalReport(reportInput);
      } finally {
        setReportLoading(false);
      }
    },
    [totalSlots],
  );

  const handleReset = useCallback(() => {
    setSession(DEFAULT_KANPO_SESSION);
    setFlowError(null);
    setReportError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(getKanpoSessionStorageKey());
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;

    const previousSnapshot = session.undoStack.at(-1);
    if (!previousSnapshot) return;

    setSession({
      ...previousSnapshot,
      undoStack: session.undoStack.slice(0, -1),
    });
    setFlowError(null);
    setReportError(null);
  }, [canUndo, session]);

  const handleOpeningSubmit = useCallback(
    async (message: string) => {
      if (!message.trim() || intakeLoading) return;

      setIntakeLoading(true);
      setFlowError(null);
      setReportError(null);

      let openingResult = buildOpeningFallback(message);

      try {
        const response = await fetch("/api/kanpo/answer-parser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "opening_intake",
            user_message: message,
          }),
        });
        if (response.ok) {
          openingResult = (await response.json()) as OpeningIntakeAnswerParserResult;
        } else {
          setFlowError("AI応答を取得できなかったため、ローカルfallbackで問診を開始しています。");
        }
      } catch {
        openingResult = buildOpeningFallback(message);
        setFlowError("AI応答を取得できなかったため、ローカルfallbackで問診を開始しています。");
      }

      const nextTurn = await requestNextTurn({
        turnNumber: 1,
        chiefComplaintSummary: openingResult.chief_complaint_summary,
        chiefComplaintCategoryHints: openingResult.chief_complaint_category_hints,
        lastCategoryId: null,
        scoreSlotStates: {},
        previousAnswerSummary: "",
        previousFeedbackHint: INITIAL_FEEDBACK,
      });

      setSession(
        withUndoSnapshot(session, {
          ...DEFAULT_KANPO_SESSION,
          chiefComplaintInput: message,
          chiefComplaintSummary: openingResult.chief_complaint_summary,
          chiefComplaintCategoryHints: openingResult.chief_complaint_category_hints,
          currentTurn: nextTurn,
          feedbackHistory: nextTurn.feedback ? [nextTurn.feedback] : [],
          safetyCheck: null,
          freeTextHistory: [
            message,
            openingResult.chief_complaint_summary,
            openingResult.red_flag_reason,
          ].filter(Boolean),
          updatedAt: new Date().toISOString(),
        }),
      );
      setIntakeLoading(false);
    },
    [intakeLoading, requestNextTurn, session],
  );

  const handleTurnSubmit = useCallback(
    async (selectedOption: number, selectedLabel: string, optionalNote: string) => {
      if (!session.currentTurn || turnLoading || reportLoading) return;

      setTurnLoading(true);
      setFlowError(null);
      setReportError(null);

      let parsedTurnAnswer = buildTurnAnswerFallback({
        selectedOption,
        optionalNote,
        selectedSlotId: session.currentTurn.selectedSlotId,
        selectedCategoryId: session.currentTurn.selectedCategoryId,
        questionText: session.currentTurn.questionText,
      });

      try {
        const response = await fetch("/api/kanpo/answer-parser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "turn_answer",
            selected_category_id: session.currentTurn.selectedCategoryId,
            selected_slot_id: session.currentTurn.selectedSlotId,
            question_text: session.currentTurn.questionText,
            selected_option: selectedOption,
            optional_note: optionalNote,
            allowed_slot_ids: session.currentTurn.candidateSlotIds,
          }),
        });

        if (response.ok) {
          parsedTurnAnswer = (await response.json()) as TurnAnswerParserResult;
        } else {
          setFlowError("AI応答を取得できなかったため、ローカルfallbackで問診を継続しています。");
        }
      } catch {
        parsedTurnAnswer = buildTurnAnswerFallback({
          selectedOption,
          optionalNote,
          selectedSlotId: session.currentTurn.selectedSlotId,
          selectedCategoryId: session.currentTurn.selectedCategoryId,
          questionText: session.currentTurn.questionText,
        });
        setFlowError("AI応答を取得できなかったため、ローカルfallbackで問診を継続しています。");
      }

      const rawMessage = [selectedLabel, optionalNote].filter(Boolean).join(" / ");

      if (session.currentTurn.phase === "safety_check") {
        const safetyThresholdTriggered = parsedTurnAnswer.selected_option >= 3;
        const safetyRedFlagReason =
          parsedTurnAnswer.red_flag_reason ||
          (safetyThresholdTriggered
            ? "安全確認で、早めに医療機関へ相談したい症状がある可能性が示されました。"
            : "");
        const safetyCheck: SafetyCheckState = {
          selectedOption: parsedTurnAnswer.selected_option,
          selectedLabel,
          freeTextSummary: parsedTurnAnswer.free_text_summary || selectedLabel,
          rawMessage,
          redFlagHint: parsedTurnAnswer.red_flag_hint || safetyThresholdTriggered,
          redFlagReason: safetyRedFlagReason,
          confidence: parsedTurnAnswer.confidence,
          answeredAt: new Date().toISOString(),
        };
        const nextFreeTextHistory = [
          ...session.freeTextHistory,
          selectedLabel,
          optionalNote,
          safetyCheck.freeTextSummary,
          safetyCheck.redFlagReason,
        ].filter((text): text is string => Boolean(text && text.trim()));

        setSession(
          withUndoSnapshot(session, {
            ...toSessionSnapshot(session),
            currentTurn: null,
            safetyCheck,
            finalReportText: "",
            updatedAt: new Date().toISOString(),
            freeTextHistory: nextFreeTextHistory,
          }),
        );
        setTurnLoading(false);

        const nextFinalReport = await generateFinalReport({
          answers: session.answers,
          scoreSlotStates: session.scoreSlotStates,
          chiefComplaintSummary: session.chiefComplaintSummary,
          safetyCheck,
          freeTextHistory: nextFreeTextHistory,
        });

        setSession((previous) => ({
          ...previous,
          finalReportText: nextFinalReport,
          updatedAt: new Date().toISOString(),
        }));
        return;
      }

      const nextScoreSlotStates = { ...session.scoreSlotStates };
      const nextFreeTextHistory = [
        ...session.freeTextHistory,
        selectedLabel,
        optionalNote,
        parsedTurnAnswer.free_text_summary,
        parsedTurnAnswer.red_flag_reason,
      ].filter((text): text is string => Boolean(text && text.trim()));

      const nextAnswers = [...session.answers];

      if (session.currentTurn.selectedSlotId) {
        const selectedSlot = getScoreSlotDefinition(session.currentTurn.selectedSlotId);
        nextScoreSlotStates[session.currentTurn.selectedSlotId] = {
          slotId: selectedSlot.id,
          hiddenScoreKey: selectedSlot.hiddenScoreKey,
          value: Math.max(0, Math.min(4, Math.trunc(parsedTurnAnswer.selected_option))) as
            | 0
            | 1
            | 2
            | 3
            | 4,
          status: "confirmed",
          confidence: parsedTurnAnswer.confidence,
          evidence: parsedTurnAnswer.free_text_summary,
          sourceTurn: session.currentTurn.turnNumber,
        };

        const nextAnswer: AnswerItem = {
          questionId: selectedSlot.hiddenScoreKey,
          questionText: session.currentTurn.questionText,
          selectedOption: parsedTurnAnswer.selected_option,
          selectedLabel,
          freeTextSummary: parsedTurnAnswer.free_text_summary,
          rawMessage,
          redFlagHint: parsedTurnAnswer.red_flag_hint,
          redFlagReason: parsedTurnAnswer.red_flag_reason,
          confidence: parsedTurnAnswer.confidence,
          answeredAt: new Date().toISOString(),
        };

        const updatedAnswers = upsertAnswerRecord(nextAnswers, nextAnswer);
        nextAnswers.splice(0, nextAnswers.length, ...updatedAnswers);
      }

      for (const hint of parsedTurnAnswer.possible_slot_hints) {
        if (hint.slot_id === session.currentTurn.selectedSlotId) continue;
        if (nextScoreSlotStates[hint.slot_id]?.status === "confirmed") continue;

        const hintedSlot = getScoreSlotDefinition(hint.slot_id);
        nextScoreSlotStates[hint.slot_id] = {
          slotId: hintedSlot.id,
          hiddenScoreKey: hintedSlot.hiddenScoreKey,
          value: null,
          status: "tentative",
          confidence: hint.confidence,
          evidence: hint.reason,
          sourceTurn: session.currentTurn.turnNumber,
        };
      }

      const nextIndex = getNextQuestionIndex(session.currentIndex);
      const nextSnapshot = computeScoreSnapshotFromConfirmedSlots(nextScoreSlotStates);
      const nextBodyLabels = buildBodyLabels(nextSnapshot.bodyFigureValues);
      const nextConfirmedCount = Object.values(nextScoreSlotStates).filter(
        (state) => state?.status === "confirmed",
      ).length;

      const nextTurn = !isKanpoConversationComplete(nextIndex)
        ? await requestNextTurn({
            turnNumber: nextIndex + 1,
            chiefComplaintSummary: session.chiefComplaintSummary,
            chiefComplaintCategoryHints: session.chiefComplaintCategoryHints,
            lastCategoryId: session.currentTurn.selectedCategoryId,
            scoreSlotStates: nextScoreSlotStates,
            previousAnswerSummary: parsedTurnAnswer.free_text_summary,
            previousFeedbackHint: buildFeedbackHint({
              confirmedCount: nextConfirmedCount,
              totalSlots,
              bodyLabels: nextBodyLabels,
            }),
          })
        : buildSafetyCheckTurn();

      setSession(
        withUndoSnapshot(session, {
          ...toSessionSnapshot(session),
          answers: nextAnswers,
          currentIndex: nextIndex,
          feedbackHistory: nextTurn?.feedback
            ? [...session.feedbackHistory, nextTurn.feedback]
            : session.feedbackHistory,
          updatedAt: new Date().toISOString(),
          scoreSlotStates: nextScoreSlotStates,
          lastCategoryId: session.currentTurn?.selectedCategoryId ?? session.lastCategoryId,
          currentTurn: nextTurn,
          safetyCheck: session.safetyCheck,
          freeTextHistory: nextFreeTextHistory,
        }),
      );

      setTurnLoading(false);
    },
    [generateFinalReport, reportLoading, requestNextTurn, session, totalSlots, turnLoading],
  );

  if (!isReady) {
    return <div className="p-6 text-sm text-muted-foreground">セッションを読み込んでいます...</div>;
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <ProgressHeader
          progress={progress}
          onReset={handleReset}
          onUndo={handleUndo}
          canUndo={canUndo}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <Card className="gap-4">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">ターンフィードバック</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{latestFeedback}</p>
                {flowError ? (
                  <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                    {flowError}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {!intakeCompleted ? (
              <OpeningIntakeCard
                disabled={intakeLoading}
                initialValue={session.chiefComplaintInput}
                onSubmit={handleOpeningSubmit}
              />
            ) : null}

            {intakeCompleted && session.currentTurn ? (
              <QuestionCard
                key={`${session.currentTurn.phase}-${session.currentTurn.turnNumber}-${session.currentTurn.selectedSlotId ?? "safety"}`}
                questionLabel={session.currentTurn.displayLabel}
                questionText={session.currentTurn.questionText}
                options={session.currentTurn.options}
                onSubmit={handleTurnSubmit}
                disabled={turnLoading || reportLoading}
                loadingLabel={
                  session.currentTurn.phase === "safety_check"
                    ? turnLoading || reportLoading
                      ? "安全確認を保存して最終レポートをまとめています..."
                      : undefined
                    : turnLoading
                      ? "回答を保存して次の質問を準備しています..."
                      : undefined
                }
              />
            ) : null}

            {session.safetyCheck || reportLoading || session.finalReportText || reportError ? (
              <FinalReport
                content={session.finalReportText}
                loading={reportLoading}
                error={reportError}
              />
            ) : null}
          </div>

          <div className="space-y-6">
            <ResultSummary
              bodyLabels={bodyLabels}
              mainScores={snapshot.mainScores}
              confirmedCount={confirmedCount}
              totalSlots={totalSlots}
            />
            <BodyTypeFigure
              values={snapshot.bodyFigureValues}
              labels={bodyLabels}
              confirmedCount={confirmedCount}
              totalSlots={totalSlots}
              visualOpacity={visualOpacity}
            />
            <RadarChart
              mainScores={snapshot.mainScores}
              confirmedCount={confirmedCount}
              totalSlots={totalSlots}
              visualOpacity={visualOpacity}
            />

            <Card className="gap-4">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">
                  {confirmedCount < 8 ? "参考候補処方プール" : "候補処方プール"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  確定情報 {confirmedCount} / {totalSlots}
                  {confirmedCount < 8 ? " のため、候補の見え方は暫定です。" : " をもとに整理しています。"}
                </p>
                {candidateFormulas.map((formula) => (
                  <div key={formula.id} className="rounded-lg bg-muted/50 p-3">
                    <p className="font-medium">{formula.name}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{formula.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="gap-4">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">問診の状態</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>ターン進行: {session.currentIndex} / {INTERVIEW_MAX_TURNS}</p>
                <p>安全確認: {session.safetyCheck ? "完了" : session.currentTurn?.phase === "safety_check" ? "回答待ち" : "未実施"}</p>
                <p>確定slot: {confirmedCount} / {totalSlots}</p>
                <p>tentative slot: {tentativeCount}</p>
                <p>更新日時: {session.updatedAt || "未保存"}</p>
                <p className="text-muted-foreground">
                  主訴: {session.chiefComplaintSummary || "未入力"}
                </p>
                <p className="text-muted-foreground">
                  現在カテゴリ: {session.currentTurn
                    ? getCategoryDefinition(session.currentTurn.selectedCategoryId).label
                    : session.finalReportText
                      ? "最終レポート完了"
                      : "待機中"}
                </p>
                <p className="text-muted-foreground">
                  最終レポート: {session.finalReportText ? "生成済み" : reportLoading ? "生成中" : "未生成"}
                </p>
                <p className="text-muted-foreground">
                  opening intake / current turn / safety check / confirmed slot / tentative slot / final report をローカルセッションへ保存しています。
                </p>
                {redFlags.hasRedFlags ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                    <p className="font-medium">赤旗候補あり</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{redFlags.summary}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleReset}>
                セッションをクリア
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
