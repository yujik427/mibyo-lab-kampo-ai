"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage, DiagnosisReport } from "@/lib/types";
import { FREE_WELCOME_MESSAGE } from "@/lib/constants";
import {
  makeId,
  getUserId,
  getConversationId,
  setConversationId as storeConversationId,
  getMessages as storedMessages,
  setMessages as storeMessages,
  saveReport,
} from "@/lib/storage";
import { parseDiagnosisResponse } from "@/lib/report-parser";

function isFinalAnalysisResult(answer: string) {
  const parsed = parseDiagnosisResponse(answer);
  const meaningfulSections = parsed.sections.filter((s) => s.title !== "診断結果").length;
  const hasStructuredHeadings =
    /##\s*体質タイプ|##\s*1\)\s*体質の整理|生活改善提案|受診の目安/.test(answer);

  const signals = [
    Boolean(parsed.constitutionType),
    meaningfulSections >= 2,
    parsed.recommendations.length >= 2,
    parsed.kampoSuggestions.length >= 1,
    Boolean(parsed.consultationGuidance),
    hasStructuredHeadings,
  ];

  return {
    isFinal: signals.filter(Boolean).length >= 2,
    parsed,
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [pendingReport, setPendingReport] = useState<DiagnosisReport | null>(null);
  const [latestReport, setLatestReport] = useState<DiagnosisReport | null>(null);
  const userIdRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    userIdRef.current = getUserId();
    setConversationId(getConversationId("free"));
    const stored = storedMessages("free");
    if (stored) {
      setMessages(stored);
    } else {
      setMessages([
        { id: makeId(), role: "assistant", content: FREE_WELCOME_MESSAGE, ts: Date.now() },
      ]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || messages.length === 0) return;
    storeMessages("free", messages);
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const typingId = makeId();
    setMessages((prev) => [
      ...prev,
      { id: makeId(), role: "user", content: text, ts: Date.now() },
      { id: typingId, role: "assistant", content: "整えてます", ts: Date.now() },
    ]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
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
        storeConversationId("free", newConv);
      }

      const finalCheck = isFinalAnalysisResult(answer);
      if (finalCheck.isFinal) {
        const report: DiagnosisReport = {
          id: makeId(),
          createdAt: new Date().toISOString(),
          mode: "free",
          rawResponse: answer,
          parsed: finalCheck.parsed,
          conversationId: newConv || conversationId,
        };
        saveReport(report);
        setPendingReport(report);
        setMessages((prev) => prev.filter((m) => m.id !== typingId));
        return;
      }

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingId);
        return [...filtered, { id: makeId(), role: "assistant", content: answer, ts: Date.now() }];
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingId);
        return [
          ...filtered,
          { id: makeId(), role: "error", content: `通信で問題が起きました。もう一度送ってみてください。\n（${msg}）`, ts: Date.now() },
        ];
      });
    } finally {
      setLoading(false);
    }
  }, [conversationId, loading]);

  const reset = useCallback(() => {
    setMessages([
      { id: makeId(), role: "assistant", content: FREE_WELCOME_MESSAGE, ts: Date.now() },
    ]);
    setConversationId("");
    setPendingReport(null);
    setLatestReport(null);
    storeConversationId("free", "");
    storeMessages("free", []);
  }, []);

  const openResult = useCallback(() => {
    if (!pendingReport) return;
    setLatestReport(pendingReport);
  }, [pendingReport]);

  return {
    messages,
    loading,
    conversationId,
    pendingReport,
    latestReport,
    sendMessage,
    openResult,
    reset,
  };
}
