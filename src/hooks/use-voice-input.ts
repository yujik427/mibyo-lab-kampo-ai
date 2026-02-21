"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

function normalizeSpeech(text: string, mode: "final" | "interim"): string {
  if (!text) return "";
  let cleaned = text.trim();

  const fillersFull = [
    /^えっと\s*/g, /^えーと\s*/g, /^あの\s*/g, /^その\s*/g,
    /^うーん\s*/g, /^んー\s*/g, /^えー\s*/g, /^まあ\s*/g, /^まぁ\s*/g,
  ];

  if (mode === "final") {
    const fillersAll = [
      ...fillersFull,
      /\s*えっと\s*/g, /\s*えーと\s*/g, /\s*あの\s*/g, /\s*その\s*/g,
      /\s*うーん\s*/g, /\s*んー\s*/g, /\s*えー\s*/g, /\s*まあ\s*/g, /\s*まぁ\s*/g,
    ];
    fillersAll.forEach((p) => { cleaned = cleaned.replace(p, " "); });
  } else {
    fillersFull.forEach((p) => { cleaned = cleaned.replace(p, ""); });
  }

  cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.replace(/\s+([、。，．])/g, "$1");
  cleaned = cleaned.replace(/([、。，．])\s+/g, "$1 ");
  return cleaned.trim();
}

function appendWithOverlap(base: string, addition: string): string {
  if (!base) return addition;
  if (!addition) return base;
  const b = base.trim();
  const a = addition.trim();
  if (!b) return a;
  if (!a) return b;

  const minLen = Math.min(b.length, a.length);
  let maxOverlap = 0;
  for (let len = minLen; len > 0; len--) {
    if (b.slice(-len) === a.slice(0, len)) {
      maxOverlap = len;
      break;
    }
  }
  return maxOverlap > 0 ? b + a.slice(maxOverlap) : b + " " + a;
}

interface UseVoiceInputOptions {
  enabled: boolean;
  onTextChange: (text: string) => void;
  initialText?: string;
}

export function useVoiceInput({ enabled, onTextChange, initialText }: UseVoiceInputOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const committedRef = useRef<string>(initialText ?? "");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setVoiceError("お使いのブラウザは音声認識に対応していません");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const n = normalizeSpeech(transcript, "final");
          if (n) final += (final ? " " : "") + n;
        } else {
          const n = normalizeSpeech(transcript, "interim");
          if (n) interim += (interim ? " " : "") + n;
        }
      }
      if (final) {
        committedRef.current = appendWithOverlap(committedRef.current, final);
      }
      const displayText = committedRef.current + (interim ? " " + interim : "");
      onTextChange(displayText.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") return;
      setVoiceError(`音声認識エラー: ${event.error}`);
      setIsRecording(false);
      recognition.stop();
    };

    recognition.onend = () => {
      setIsRecording(false);
      onTextChange(committedRef.current);
    };

    recognitionRef.current = recognition;
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [enabled, onTextChange]);

  const toggleRecording = useCallback((currentText: string) => {
    if (!recognitionRef.current) {
      setVoiceError("音声認識が初期化されていません");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      onTextChange(committedRef.current);
    } else {
      setVoiceError(null);
      committedRef.current = currentText.trim();
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }, [isRecording, onTextChange]);

  const resetCommitted = useCallback(() => {
    committedRef.current = "";
  }, []);

  const updateCommitted = useCallback((text: string) => {
    committedRef.current = text;
  }, []);

  return { isRecording, voiceError, toggleRecording, resetCommitted, updateCommitted };
}
