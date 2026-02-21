import type { ChatMessage, DiagnosisReport } from "./types";
import {
  LS_USER_ID,
  LS_CONV_ID_FREE,
  LS_CONV_ID_DIAG,
  LS_MESSAGES_FREE,
  LS_MESSAGES_DIAG,
  LS_MODE,
  LS_DIAG_ANSWERS,
  LS_DIAG_INDEX,
  LS_REPORTS,
} from "./constants";

function makeId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

export function getUserId(): string {
  let id = localStorage.getItem(LS_USER_ID);
  if (!id) {
    id = makeId();
    localStorage.setItem(LS_USER_ID, id);
  }
  return id;
}

export function getStoredMode(): "start" | "free" | "diagnosis" {
  const mode = localStorage.getItem(LS_MODE);
  if (mode === "free" || mode === "diagnosis") return mode;
  return "start";
}

export function setStoredMode(mode: string) {
  localStorage.setItem(LS_MODE, mode);
}

export function getConversationId(mode: "free" | "diagnosis"): string {
  const key = mode === "free" ? LS_CONV_ID_FREE : LS_CONV_ID_DIAG;
  return localStorage.getItem(key) || "";
}

export function setConversationId(mode: "free" | "diagnosis", id: string) {
  const key = mode === "free" ? LS_CONV_ID_FREE : LS_CONV_ID_DIAG;
  localStorage.setItem(key, id);
}

export function getMessages(mode: "free" | "diagnosis"): ChatMessage[] | null {
  const key = mode === "free" ? LS_MESSAGES_FREE : LS_MESSAGES_DIAG;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setMessages(mode: "free" | "diagnosis", messages: ChatMessage[]) {
  const key = mode === "free" ? LS_MESSAGES_FREE : LS_MESSAGES_DIAG;
  localStorage.setItem(key, JSON.stringify(messages));
}

export function getDiagnosisAnswers(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_DIAG_ANSWERS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
    return {};
  } catch {
    return {};
  }
}

export function setDiagnosisAnswers(answers: Record<string, string>) {
  localStorage.setItem(LS_DIAG_ANSWERS, JSON.stringify(answers));
}

export function getDiagnosisIndex(): number {
  try {
    const raw = localStorage.getItem(LS_DIAG_INDEX);
    if (!raw) return 0;
    const index = parseInt(raw, 10);
    return !isNaN(index) && index >= 0 ? index : 0;
  } catch {
    return 0;
  }
}

export function setDiagnosisIndex(index: number) {
  localStorage.setItem(LS_DIAG_INDEX, index.toString());
}

export function clearAll() {
  localStorage.removeItem(LS_MESSAGES_FREE);
  localStorage.removeItem(LS_MESSAGES_DIAG);
  localStorage.removeItem(LS_CONV_ID_FREE);
  localStorage.removeItem(LS_CONV_ID_DIAG);
  localStorage.removeItem(LS_MODE);
  localStorage.removeItem(LS_DIAG_ANSWERS);
  localStorage.removeItem(LS_DIAG_INDEX);
}

// --- Report Storage ---

export function getReports(): DiagnosisReport[] {
  try {
    const raw = localStorage.getItem(LS_REPORTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReport(report: DiagnosisReport) {
  const reports = getReports();
  reports.unshift(report);
  localStorage.setItem(LS_REPORTS, JSON.stringify(reports));
}

export function getReportById(id: string): DiagnosisReport | null {
  const reports = getReports();
  return reports.find((r) => r.id === id) ?? null;
}

export function deleteReport(id: string) {
  const reports = getReports().filter((r) => r.id !== id);
  localStorage.setItem(LS_REPORTS, JSON.stringify(reports));
}

export { makeId };
