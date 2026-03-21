"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BodyTypeFigure } from "@/components/kanpo/BodyTypeFigure";
import { FinalReport } from "@/components/kanpo/FinalReport";
import { ProgressHeader } from "@/components/kanpo/ProgressHeader";
import { QuestionCard } from "@/components/kanpo/QuestionCard";
import { RadarChart } from "@/components/kanpo/RadarChart";
import { ResultSummary } from "@/components/kanpo/ResultSummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_KANPO_SESSION,
  buildQuestionProgress,
  getKanpoQuestionByIndex,
  getKanpoSessionStorageKey,
  getNextQuestionIndex,
  isKanpoConversationComplete,
} from "@/lib/kanpo/conversationEngine";
import { buildFormulaPool } from "@/lib/kanpo/formulaPool";
import { buildBodyLabels } from "@/lib/kanpo/labelEngine";
import { buildFallbackFinalReport, buildFinalReportInput } from "@/lib/kanpo/reportBuilder";
import { evaluateRedFlags } from "@/lib/kanpo/redFlagRules";
import { computeScoreSnapshot } from "@/lib/kanpo/scoreEngine";
import type { AnswerItem, KanpoSessionState, ParsedAnswer, Question } from "@/lib/kanpo/types";

const INITIAL_FEEDBACK =
  "無理のない範囲で、直近2週間の感覚に近いものを選んでください。一緒に整理していきましょう。";

function buildManualParsedAnswer(question: Question, selectedOption: number, rawMessage: string): ParsedAnswer {
  return {
    question_id: question.id,
    selected_option: selectedOption,
    free_text_summary:
      question.options.find((option) => option.value === selectedOption)?.shortLabel || rawMessage,
    red_flag_hint: false,
    red_flag_reason: "",
    confidence: "high",
  };
}

function extractFeedbackOnly(content: string, nextQuestionText: string) {
  const trimmed = content.trim();
  if (!trimmed) return "";

  const questionIndex = trimmed.indexOf(nextQuestionText);
  if (questionIndex > 0) {
    return trimmed.slice(0, questionIndex).trim();
  }

  const lines = trimmed.split("\n");
  const splitIndex = lines.findIndex(
    (line) =>
      line.includes(nextQuestionText) ||
      /^質問\s*\d+/u.test(line.trim()) ||
      /^Q?\d+\s/.test(line.trim()),
  );

  return splitIndex > 0 ? lines.slice(0, splitIndex).join("\n").trim() : trimmed;
}

function buildFeedbackHint(bodyLabels: ReturnType<typeof buildBodyLabels>) {
  return `虚実=${bodyLabels.kyojitsu}, 寒熱=上${bodyLabels.upperTemperature}/下${bodyLabels.lowerTemperature}, 燥湿=上${bodyLabels.upperTexture}/下${bodyLabels.lowerTexture}`;
}

function buildFallbackTurnFeedback(question: Question, bodyLabels: ReturnType<typeof buildBodyLabels>) {
  return `${question.text} に近い回答から、${bodyLabels.kyojitsu}・${bodyLabels.upperTemperature}寄りの動きが少し見えています。引き続き一緒に整理していきましょう。`;
}

function getFriendlyFeedbackFallbackMessage() {
  return "AIフィードバックを利用できなかったため、ローカル文面で継続しています。";
}

function getFriendlyFinalReportFallbackMessage() {
  return "AI最終レポートを利用できなかったため、ローカル生成レポートを表示しています。";
}

export default function KanpoChatPage() {
  const [session, setSession] = useState<KanpoSessionState>(DEFAULT_KANPO_SESSION);
  const [isReady, setIsReady] = useState(false);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
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
  const currentQuestion = getKanpoQuestionByIndex(session.currentIndex);
  const progress = buildQuestionProgress(session.currentIndex);
  const snapshot = useMemo(() => computeScoreSnapshot(session.answers), [session.answers]);
  const bodyLabels = useMemo(
    () => buildBodyLabels(snapshot.bodyFigureValues),
    [snapshot.bodyFigureValues],
  );
  const candidateFormulas = useMemo(
    () => buildFormulaPool(snapshot.mainScores, snapshot.subScores),
    [snapshot.mainScores, snapshot.subScores],
  );
  const redFlags = useMemo(() => evaluateRedFlags(session.answers), [session.answers]);
  const finalReportInput = useMemo(
    () =>
      buildFinalReportInput({
        answers: session.answers,
        snapshot,
        candidateFormulas,
        redFlags,
      }),
    [candidateFormulas, redFlags, session.answers, snapshot],
  );
  const latestFeedback = session.feedbackHistory.at(-1) || INITIAL_FEEDBACK;

  const handleReset = useCallback(() => {
    setSession(DEFAULT_KANPO_SESSION);
    setFeedbackError(null);
    setReportError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(getKanpoSessionStorageKey());
    }
  }, []);

  const handleSelect = useCallback(
    async (selectedOption: number, rawMessage: string) => {
      if (!currentQuestion || answerLoading) return;

      setAnswerLoading(true);
      setFeedbackError(null);

      let parsedAnswer = buildManualParsedAnswer(currentQuestion, selectedOption, rawMessage);

      try {
        const parseResponse = await fetch("/api/kanpo/parse-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: currentQuestion.id,
            question_text: currentQuestion.text,
            options: currentQuestion.options.map((option) => option.label),
            user_message: rawMessage,
          }),
        });

        if (parseResponse.ok) {
          parsedAnswer = (await parseResponse.json()) as ParsedAnswer;
        }
      } catch {
        // 初期段階ではフォールバックで進める。
      }

      const selectedLabel =
        currentQuestion.options.find((option) => option.value === parsedAnswer.selected_option)?.label ??
        rawMessage;

      const nextAnswer: AnswerItem = {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        selectedOption: parsedAnswer.selected_option,
        selectedLabel,
        freeTextSummary: parsedAnswer.free_text_summary || selectedLabel,
        rawMessage,
        redFlagHint: parsedAnswer.red_flag_hint,
        redFlagReason: parsedAnswer.red_flag_reason,
        confidence: parsedAnswer.confidence,
        answeredAt: new Date().toISOString(),
      };

      const nextAnswers = [...session.answers, nextAnswer];
      const nextIndex = getNextQuestionIndex(session.currentIndex);
      const nextSnapshot = computeScoreSnapshot(nextAnswers);
      const nextBodyLabels = buildBodyLabels(nextSnapshot.bodyFigureValues);
      let nextFeedback = "";
      let nextFinalReport = session.finalReportText;
      let nextReportError: string | null = null;

      if (!isKanpoConversationComplete(nextIndex)) {
        const nextQuestion = getKanpoQuestionByIndex(nextIndex);
        if (nextQuestion) {
          try {
            const feedbackResponse = await fetch("/api/kanpo/chat-turn", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                question_number: nextIndex + 1,
                question_text: nextQuestion.text,
                options: nextQuestion.options.map((option) => option.label),
                previous_answer_summary: nextAnswer.freeTextSummary,
                previous_feedback_hint: buildFeedbackHint(nextBodyLabels),
              }),
            });

            if (feedbackResponse.ok) {
              const data = (await feedbackResponse.json()) as { content?: string };
              nextFeedback = extractFeedbackOnly(data.content ?? "", nextQuestion.text);
            } else {
              setFeedbackError(getFriendlyFeedbackFallbackMessage());
            }
          } catch {
            setFeedbackError(getFriendlyFeedbackFallbackMessage());
          }

          if (!nextFeedback) {
            nextFeedback = buildFallbackTurnFeedback(nextQuestion, nextBodyLabels);
          }
        }
      } else {
        const nextRedFlags = evaluateRedFlags(nextAnswers);
        const nextFormulaPool = buildFormulaPool(nextSnapshot.mainScores, nextSnapshot.subScores);
        const reportInput = buildFinalReportInput({
          answers: nextAnswers,
          snapshot: nextSnapshot,
          candidateFormulas: nextFormulaPool,
          redFlags: nextRedFlags,
        });

        setReportLoading(true);
        try {
          const reportResponse = await fetch("/api/kanpo/final-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reportInput),
          });

          if (!reportResponse.ok) {
            const data = (await reportResponse.json().catch(() => ({}))) as { detail?: string };
            throw new Error(data.detail || "最終レポート生成に失敗しました。");
          }

          const data = (await reportResponse.json()) as { content?: string };
          nextFinalReport = data.content || buildFallbackFinalReport(reportInput);
        } catch {
          nextFinalReport = buildFallbackFinalReport(reportInput);
          nextReportError = getFriendlyFinalReportFallbackMessage();
        } finally {
          setReportLoading(false);
        }
      }

      setReportError(nextReportError);
      setSession({
        answers: nextAnswers,
        currentIndex: nextIndex,
        feedbackHistory: nextFeedback ? [...session.feedbackHistory, nextFeedback] : session.feedbackHistory,
        finalReportText: nextFinalReport,
        updatedAt: new Date().toISOString(),
      });
      setAnswerLoading(false);
    },
    [answerLoading, currentQuestion, session],
  );

  if (!isReady) {
    return <div className="p-6 text-sm text-muted-foreground">セッションを読み込んでいます...</div>;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <ProgressHeader progress={progress} onReset={handleReset} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <Card className="gap-4">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">ターンフィードバック</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{latestFeedback}</p>
              {feedbackError ? (
                <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                  {feedbackError}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {!isComplete && currentQuestion ? (
            <QuestionCard
              questionNumber={session.currentIndex + 1}
              question={currentQuestion}
              onSelect={handleSelect}
              disabled={answerLoading || reportLoading}
              loadingLabel={answerLoading ? "回答を保存して次の質問を準備しています..." : undefined}
            />
          ) : null}

          {isComplete ? (
            <FinalReport
              content={session.finalReportText}
              loading={reportLoading}
              error={reportError}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <ResultSummary bodyLabels={bodyLabels} mainScores={snapshot.mainScores} />
          <BodyTypeFigure values={snapshot.bodyFigureValues} labels={bodyLabels} />
          <RadarChart mainScores={snapshot.mainScores} />

          <Card className="gap-4">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">候補処方プール</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
              <CardTitle className="text-base">保存状態</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>回答数: {session.answers.length} / 20</p>
              <p>更新日時: {session.updatedAt || "未保存"}</p>
              <p className="text-muted-foreground">
                selected_option / free_text_summary / 赤旗ヒントをローカルセッションへ保存しています。
              </p>
              {redFlags.hasRedFlags ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                  <p className="font-medium">赤旗候補あり</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{redFlags.summary}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">最終レポート入力プレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-3 text-xs leading-6 text-muted-foreground">
                {JSON.stringify(finalReportInput, null, 2)}
              </pre>
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
  );
}
