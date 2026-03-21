"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Mic, MicOff, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string) => void;
  loading?: boolean;
  isRecording?: boolean;
  voiceError?: string | null;
  onToggleRecording?: (text: string) => void;
  onTextChange?: (text: string) => void;
  disabled?: boolean;
  value?: string;
}

export function ChatInput({
  onSend,
  loading,
  isRecording,
  voiceError,
  onToggleRecording,
  onTextChange,
  disabled,
  value,
}: ChatInputProps) {
  const [internalText, setInternalText] = useState("");
  const text = value !== undefined ? value : internalText;
  const setText = useCallback(
    (v: string) => {
      setInternalText(v);
      onTextChange?.(v);
    },
    [onTextChange],
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composingRef = useRef(false);

  const canSend = useMemo(
    () => text.trim().length > 0 && !loading && !isRecording && !disabled,
    [text, loading, isRecording, disabled],
  );

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [text]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSend) return;
      onSend(text.trim());
      setText("");
    },
    [canSend, text, onSend, setText],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (composingRef.current) return;
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (canSend) {
          onSend(text.trim());
          setText("");
        }
      }
    },
    [canSend, text, onSend, setText],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-end gap-2 border-t border-border bg-card p-3"
    >
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={() => { composingRef.current = false; }}
          placeholder="漢方薬剤師に相談する…"
          className={cn(
            "w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-[height] duration-100",
          )}
          disabled={loading || isRecording || disabled}
          rows={1}
        />
        {isRecording && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
            </span>
          </div>
        )}
      </div>

      {onToggleRecording && (
        <Button
          type="button"
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          className="shrink-0"
          onClick={() => onToggleRecording(text)}
          disabled={loading || disabled}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      )}

      <Button type="submit" size="icon" className="shrink-0" disabled={!canSend}>
        <SendHorizonal className="h-4 w-4" />
      </Button>

      {voiceError && (
        <p className="absolute -top-6 left-3 text-xs text-destructive">{voiceError}</p>
      )}
    </form>
  );
}
