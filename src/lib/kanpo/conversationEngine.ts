import {
  KANPO_CHAT_QUESTIONS,
  KANPO_CHAT_STORAGE_KEY,
  KANPO_CHAT_TOTAL_QUESTIONS,
} from "./questions";
import type { KanpoSessionState, Question, QuestionProgress } from "./types";

export const DEFAULT_KANPO_SESSION: KanpoSessionState = {
  answers: [],
  currentIndex: 0,
  feedbackHistory: [],
  finalReportText: "",
  updatedAt: "",
  chiefComplaintInput: "",
  chiefComplaintSummary: "",
  chiefComplaintCategoryHints: [],
  scoreSlotStates: {},
  lastCategoryId: null,
  currentTurn: null,
  safetyCheck: null,
  freeTextHistory: [],
  undoStack: [],
};

export function getKanpoSessionStorageKey() {
  return KANPO_CHAT_STORAGE_KEY;
}

export function getKanpoQuestionByIndex(index: number): Question | null {
  return KANPO_CHAT_QUESTIONS[index] ?? null;
}

export function getCurrentQuestion(session: Pick<KanpoSessionState, "currentIndex">) {
  return getKanpoQuestionByIndex(session.currentIndex);
}

export function isKanpoConversationComplete(currentIndex: number) {
  return currentIndex >= KANPO_CHAT_TOTAL_QUESTIONS;
}

export function getNextQuestionIndex(currentIndex: number) {
  return Math.min(currentIndex + 1, KANPO_CHAT_TOTAL_QUESTIONS);
}

export function buildQuestionProgress(currentIndex: number): QuestionProgress {
  const visibleStep = Math.min(currentIndex + 1, KANPO_CHAT_TOTAL_QUESTIONS);

  return {
    current: visibleStep,
    total: KANPO_CHAT_TOTAL_QUESTIONS,
    percent:
      KANPO_CHAT_TOTAL_QUESTIONS > 0
        ? Math.min(100, (Math.max(0, visibleStep) / KANPO_CHAT_TOTAL_QUESTIONS) * 100)
        : 0,
  };
}
