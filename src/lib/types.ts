export type Role = "user" | "assistant" | "error";
export type Mode = "start" | "free" | "diagnosis";

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  ts: number;
};

export type DiagnosisOption = {
  value: string;
  label: string;
};

export type DiagnosisQuestion = {
  id: string;
  question: string;
  options: DiagnosisOption[];
};

export interface DiagnosisReport {
  id: string;
  createdAt: string;
  mode: "free" | "diagnosis";
  answers?: Record<string, string>;
  rawResponse: string;
  parsed: {
    constitutionType: string;
    summary: string;
    sections: {
      title: string;
      content: string;
    }[];
    recommendations: { title: string; content: string }[];
    kampoSuggestions: string[];
    consultationGuidance?: string;
  };
  conversationId: string;
}
