"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage, DiagnosisReport } from "@/lib/types";
import { DIAGNOSIS_QUESTIONS } from "@/lib/constants";
import {
  makeId,
  getUserId,
  getConversationId,
  setConversationId as storeConversationId,
  getMessages as storedMessages,
  setMessages as storeMessages,
  getDiagnosisAnswers,
  setDiagnosisAnswers as storeDiagAnswers,
  getDiagnosisIndex,
  setDiagnosisIndex as storeDiagIndex,
  saveReport,
} from "@/lib/storage";
import { parseDiagnosisResponse } from "@/lib/report-parser";

export function useDiagnosis() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [latestReport, setLatestReport] = useState<DiagnosisReport | null>(null);
  const userIdRef = useRef("");

  const isCompleted = currentIndex >= DIAGNOSIS_QUESTIONS.length;
  const currentQuestion = DIAGNOSIS_QUESTIONS[currentIndex] ?? null;
  const progress = { current: currentIndex + 1, total: DIAGNOSIS_QUESTIONS.length };

  useEffect(() => {
    if (typeof window === "undefined") return;
    userIdRef.current = getUserId();
    setConversationId(getConversationId("diagnosis"));
    setAnswers(getDiagnosisAnswers());

    const storedIndex = getDiagnosisIndex();
    setCurrentIndex(storedIndex);

    const stored = storedMessages("diagnosis");
    if (stored) {
      setMessages(stored);
    } else if (storedIndex < DIAGNOSIS_QUESTIONS.length) {
      const q = DIAGNOSIS_QUESTIONS[storedIndex];
      setMessages([{ id: makeId(), role: "assistant", content: q.question, ts: Date.now() }]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || messages.length === 0) return;
    storeMessages("diagnosis", messages);
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    storeDiagAnswers(answers);
  }, [answers]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    storeDiagIndex(currentIndex);
  }, [currentIndex]);

  const answerQuestion = useCallback(
    (questionId: string, answerValue: string, answerLabel: string) => {
      const newAnswers = { ...answers, [questionId]: answerValue };
      setAnswers(newAnswers);

      setMessages((prev) => {
        const next: ChatMessage[] = [
          ...prev,
          { id: makeId(), role: "user", content: answerLabel, ts: Date.now() },
        ];
        const nextIdx = currentIndex + 1;
        if (nextIdx < DIAGNOSIS_QUESTIONS.length) {
          next.push({
            id: makeId(),
            role: "assistant",
            content: DIAGNOSIS_QUESTIONS[nextIdx].question,
            ts: Date.now(),
          });
        }
        return next;
      });

      if (currentIndex < DIAGNOSIS_QUESTIONS.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(DIAGNOSIS_QUESTIONS.length);
      }
    },
    [answers, currentIndex],
  );

  const generateResult = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const answerList = Object.entries(answers)
      .map(([qId, answerValue]) => {
        const q = DIAGNOSIS_QUESTIONS.find((q) => q.id === qId);
        const answerLabel =
          q?.options.find((option) => option.value === answerValue)?.label ?? answerValue;
        return `- ${q?.question ?? qId}: ${answerLabel}`;
      })
      .join("\n");

    const query = `---
あなたは漢方の薬剤師AIです。以下は直近2週間の20問体質診断回答です。
回答一覧（questionId: answerLabel）：
${answerList}

【必ず次のフォーマットで出力してください】

## 体質タイプ
（例：気虚傾向、気滞＋血虚 など、1行で）

## 1) 体質の整理
（エネルギー不足/血の巡り/水分バランス、冷え/のぼせ等を2〜4文で整理）

## 2) 体質に合う漢方の方向性
（方向性＋代表処方名を1〜3候補。断定しない）

## 3) 生活改善提案（すぐできること3つ）
① 見出し（5文字以内）：具体的な説明
② 見出し（5文字以内）：具体的な説明
③ 見出し（5文字以内）：具体的な説明

## 4) 受診の目安
（受診が必要な場合のみ1〜2文で簡潔に。不要なら「現時点ではセルフケアを優先で問題ありません」と記載）

※医療行為の断定はしない。
---`;

    try {
      const response = await fetch("/api/chat/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          conversation_id: conversationId,
          user: userIdRef.current || "user",
        }),
      });
      const data = await response.json().catch(() => ({} as Record<string, unknown>));
      if (!response.ok) throw new Error((data?.error as string) || `HTTP ${response.status}`);

      const answer =
        (data?.answer as string) ??
        ((data?.data as Record<string, unknown>)?.answer as string) ??
        "（回答が取得できませんでした）";
      const newConv =
        (data?.conversation_id as string) ??
        ((data?.data as Record<string, unknown>)?.conversation_id as string) ??
        "";

      if (newConv) {
        setConversationId(newConv);
        storeConversationId("diagnosis", newConv);
      }



      const report: DiagnosisReport = {
        id: makeId(),
        createdAt: new Date().toISOString(),
        mode: "diagnosis",
        answers,
        rawResponse: answer,
        parsed: parseDiagnosisResponse(answer),
        conversationId: newConv || conversationId,
      };
      saveReport(report);
      setLatestReport(report);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "error",
          content: `通信で問題が起きました。もう一度送ってみてください。\n（${msg}）`,
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [answers, conversationId, loading]);

  const reset = useCallback(() => {
    setMessages([]);
    setAnswers({});
    setCurrentIndex(0);
    setConversationId("");
    setLatestReport(null);
    storeConversationId("diagnosis", "");
    storeMessages("diagnosis", []);
    storeDiagAnswers({});
    storeDiagIndex(0);
    const q = DIAGNOSIS_QUESTIONS[0];
    setMessages([{ id: makeId(), role: "assistant", content: q.question, ts: Date.now() }]);
  }, []);

  return {
    messages,
    loading,
    isCompleted,
    currentQuestion,
    progress,
    latestReport,
    answerQuestion,
    generateResult,
    reset,
  };
}
