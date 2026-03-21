export type QuestionId =
  | "Q01"
  | "Q02"
  | "Q03"
  | "Q04"
  | "Q05"
  | "Q06"
  | "Q07"
  | "Q08"
  | "Q09"
  | "Q10"
  | "Q11"
  | "Q12"
  | "Q13"
  | "Q14"
  | "Q15"
  | "Q16"
  | "Q17"
  | "Q18"
  | "Q19"
  | "Q20";

export type QuestionCategory =
  | "energy"
  | "qi-flow"
  | "blood"
  | "dampness"
  | "dryness"
  | "digestion"
  | "stress";

export type ConfidenceLevel = "high" | "medium" | "low";
export type MainScoreName = "気滞" | "気逆" | "気虚" | "血虚" | "瘀血" | "水滞" | "津液不足";

export interface QuestionOption {
  value: number;
  label: string;
  shortLabel: string;
}

export interface Question {
  id: QuestionId;
  text: string;
  options: readonly QuestionOption[];
  category: QuestionCategory;
}

export interface ParsedAnswer {
  question_id: QuestionId;
  selected_option: number;
  free_text_summary: string;
  red_flag_hint: boolean;
  red_flag_reason: string;
  confidence: ConfidenceLevel;
}

export interface AnswerItem {
  questionId: QuestionId;
  questionText: string;
  selectedOption: number;
  selectedLabel: string;
  freeTextSummary: string;
  rawMessage: string;
  redFlagHint: boolean;
  redFlagReason: string;
  confidence: ConfidenceLevel;
  answeredAt: string;
}

export interface ScoreDetail {
  raw: number;
  max: number;
  percent: number;
  level: number;
}

export type MainScores = Record<MainScoreName, ScoreDetail>;

export interface SubScores {
  dry: ScoreDetail;
  damp: ScoreDetail;
  upperDamp: ScoreDetail;
  lowerDamp: ScoreDetail;
  upperDry: ScoreDetail;
  lowerDry: ScoreDetail;
}

export interface BodyFigureValues {
  kyojitsu: number;
  upperTemp: number;
  lowerTemp: number;
  soshitsu: number;
  upperTextureScore: number;
  lowerTextureScore: number;
}

export interface BodyLabels {
  kyojitsu: string;
  upperTemperature: string;
  lowerTemperature: string;
  upperTexture: string;
  lowerTexture: string;
}

export interface CandidateFormula {
  id: string;
  name: string;
  reason: string;
  targetPatterns: string[];
}

export interface RedFlagMatch {
  id: string;
  label: string;
  reason: string;
}

export interface RedFlagSummary {
  hasRedFlags: boolean;
  matchedRules: RedFlagMatch[];
  summary: string;
}

export interface ScoreSnapshot {
  mainScores: MainScores;
  subScores: SubScores;
  bodyFigureValues: BodyFigureValues;
}

export interface FinalReportInput {
  main_scores: Record<MainScoreName, number>;
  sub_scores: {
    dry: number;
    damp: number;
    upper_damp: number;
    lower_damp: number;
    upper_dry: number;
    lower_dry: number;
  };
  body_labels: BodyLabels;
  chief_complaint_summary: string;
  answer_summary: string;
  candidate_formulas: CandidateFormula[];
  knowledge_base_context: string;
  red_flag_summary: string;
}

export interface QuestionProgress {
  current: number;
  total: number;
  percent: number;
}

export interface KanpoSessionState {
  answers: AnswerItem[];
  currentIndex: number;
  feedbackHistory: string[];
  finalReportText: string;
  updatedAt: string;
}
