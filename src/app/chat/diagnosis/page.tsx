"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { DiagnosisOptions } from "@/components/chat/diagnosis-options";
import { DiagnosisComplete } from "@/components/chat/diagnosis-complete";
import { useDiagnosis } from "@/hooks/use-diagnosis";

export default function DiagnosisPage() {
  const router = useRouter();
  const {
    messages,
    loading,
    isCompleted,
    currentQuestion,
    progress,
    latestReport,
    answerQuestion,
    generateResult,
    reset,
  } = useDiagnosis();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages.length, isCompleted]);

  useEffect(() => {
    if (latestReport) {
      router.push(`/report/${latestReport.id}`);
    }
  }, [latestReport, router]);

  return (
    <div className="flex h-full flex-col bg-background">
      <ChatHeader
        title="スピード分析（20問）"
        subtitle={isCompleted ? "診断完了" : `${progress.current} / ${progress.total}`}
        onBack={() => router.push("/")}
        onReset={reset}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-2.5 p-4 pb-2">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}

          {!isCompleted && currentQuestion && (
            <DiagnosisOptions
              question={currentQuestion}
              progress={progress}
              onSelect={answerQuestion}
            />
          )}

          {isCompleted && !latestReport && (
            <DiagnosisComplete
              onGenerateResult={generateResult}
              loading={loading}
            />
          )}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>
    </div>
  );
}
