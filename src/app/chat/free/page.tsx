"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { DiagnosisComplete } from "@/components/chat/diagnosis-complete";
import { useChat } from "@/hooks/use-chat";
import { useVoiceInput } from "@/hooks/use-voice-input";

export default function FreeChatPage() {
  const router = useRouter();
  const { messages, loading, pendingReport, latestReport, sendMessage, openResult, reset } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");

  const handleVoiceTextChange = useCallback((text: string) => {
    setInputText(text);
  }, []);

  const voice = useVoiceInput({
    enabled: true,
    onTextChange: handleVoiceTextChange,
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages.length, pendingReport]);

  useEffect(() => {
    if (latestReport) {
      router.push(`/report/${latestReport.id}`);
    }
  }, [latestReport, router]);

  const handleSend = useCallback(
    (text: string) => {
      if (voice.isRecording) {
        voice.toggleRecording(text);
      }
      voice.resetCommitted();
      setInputText("");
      sendMessage(text);
    },
    [sendMessage, voice],
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <ChatHeader
        title="体質分析"
        subtitle="漢方薬剤師AIに相談"
        onBack={() => router.push("/")}
        onReset={reset}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-2.5 p-4 pb-2">
          {messages.map((m) => (
            <ChatBubble
              key={m.id}
              message={m}
              isTyping={m.content === "整えてます" && loading}
            />
          ))}
          {pendingReport && (
            <DiagnosisComplete
              onGenerateResult={openResult}
              title="全20問への回答が完了しました"
              description="AIによる体質分析が完了しました。結果ページで詳しく確認できます"
              buttonLabel="分析結果を見る"
              loadingLabel="結果を開いています…"
            />
          )}
          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {!pendingReport && (
        <ChatInput
          onSend={handleSend}
          loading={loading}
          isRecording={voice.isRecording}
          voiceError={voice.voiceError}
          onToggleRecording={voice.toggleRecording}
          value={inputText}
          onTextChange={(t) => {
            setInputText(t);
            if (!voice.isRecording) voice.updateCommitted(t);
          }}
        />
      )}
    </div>
  );
}
