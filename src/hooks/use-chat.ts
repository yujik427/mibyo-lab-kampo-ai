"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { FREE_WELCOME_MESSAGE } from "@/lib/constants";
import {
  makeId,
  getUserId,
  getConversationId,
  setConversationId as storeConversationId,
  getMessages as storedMessages,
  setMessages as storeMessages,
} from "@/lib/storage";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");
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
    storeConversationId("free", "");
    storeMessages("free", []);
  }, []);

  return { messages, loading, conversationId, sendMessage, reset };
}
