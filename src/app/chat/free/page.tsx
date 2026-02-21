"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { useChat } from "@/hooks/use-chat";
import { useVoiceInput } from "@/hooks/use-voice-input";

export default function FreeChatPage() {
  const router = useRouter();
  const { messages, loading, sendMessage, reset } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleTextChange = useCallback(() => {}, []);

  const voice = useVoiceInput({
    enabled: true,
    onTextChange: handleTextChange,
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages.length]);

  const handleSend = useCallback(
    (text: string) => {
      if (voice.isRecording) {
        voice.toggleRecording(text);
      }
      voice.resetCommitted();
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
          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      <ChatInput
        onSend={handleSend}
        loading={loading}
        isRecording={voice.isRecording}
        voiceError={voice.voiceError}
        onToggleRecording={voice.toggleRecording}
        onTextChange={(t) => {
          if (!voice.isRecording) voice.updateCommitted(t);
        }}
      />
    </div>
  );
}
