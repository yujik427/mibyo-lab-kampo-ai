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
export type AnswerMode = "scale_0_4_with_optional_note";

export type CategoryId =
  | "sleep_recovery"
  | "stress_emotion"
  | "qi_flow"
  | "blood_state"
  | "water_balance"
  | "dry_damp_balance"
  | "safety_check";
export type ChiefComplaintCategoryHint = Exclude<CategoryId, "safety_check">;

export type CategoryPhase = "early" | "core" | "late" | "safety";

export type ScoreSlotId =
  | "fatigue_on_waking"
  | "exertional_fatigue"
  | "sighing"
  | "stress_bloating"
  | "belching_nausea"
  | "throat_chest_stuck"
  | "orthostatic_dizziness"
  | "eye_fatigue_blur"
  | "fixed_pain_stiffness"
  | "dark_complexion_dark_lips"
  | "lower_body_edema_heavy"
  | "upper_body_heavy_head"
  | "mouth_throat_dryness"
  | "lower_body_skin_dryness"
  | "post_meal_sleepiness"
  | "stress_digestive_disruption"
  | "humidity_sensitive"
  | "hard_dry_stool"
  | "vertigo_heavy_motion"
  | "evening_upper_dryness";

export type SlotStatus = "empty" | "tentative" | "confirmed";
export type BodyRegion = "whole" | "upper" | "lower";
export type SubScoreTarget = "dry" | "damp" | "upperDamp" | "lowerDamp" | "upperDry" | "lowerDry";

export interface MainScoreLink {
  target: MainScoreName;
  weight: number;
}

export interface SubScoreLink {
  target: SubScoreTarget;
  role: "primary" | "support";
  weight: number;
}

export interface CategoryDefinition {
  id: CategoryId;
  label: string;
  description: string;
  phase: CategoryPhase;
  required: boolean;
  scoreSlotIds: readonly ScoreSlotId[];
  targetTurnWindow: readonly [number, number];
  chiefComplaintBiasEligible: boolean;
  chiefComplaintHintKeywords: readonly string[];
}

export interface ScoreSlotDefinition {
  id: ScoreSlotId;
  hiddenScoreKey: QuestionId;
  categoryId: Exclude<CategoryId, "safety_check">;
  label: string;
  canonicalQuestionText: string;
  promptIntent: string;
  optionalNoteHint: string;
  bodyRegion: BodyRegion;
  chiefComplaintKeywords: readonly string[];
  mainScoreLinks: readonly MainScoreLink[];
  subScoreLinks: readonly SubScoreLink[];
}

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

export type AnswerParserMode = "opening_intake" | "turn_answer";

export interface OpeningIntakeAnswerParserInput {
  mode: "opening_intake";
  user_message: string;
}

export interface OpeningIntakeAnswerParserResult {
  mode: "opening_intake";
  chief_complaint_summary: string;
  chief_complaint_category_hints: ChiefComplaintCategoryHint[];
  red_flag_hint: boolean;
  red_flag_reason: string;
}

export interface PossibleSlotHint {
  slot_id: ScoreSlotId;
  confidence: ConfidenceLevel;
  reason: string;
}

export interface TurnAnswerParserInput {
  mode: "turn_answer";
  selected_category_id?: CategoryId;
  selected_slot_id?: ScoreSlotId | null;
  question_text: string;
  selected_option: number;
  optional_note?: string;
  allowed_slot_ids?: ScoreSlotId[];
}

export interface TurnAnswerParserResult {
  mode: "turn_answer";
  selected_option: number;
  free_text_summary: string;
  red_flag_hint: boolean;
  red_flag_reason: string;
  confidence: ConfidenceLevel;
  possible_slot_hints: PossibleSlotHint[];
}

export type AnswerParserInput = OpeningIntakeAnswerParserInput | TurnAnswerParserInput;
export type AnswerParserResult = OpeningIntakeAnswerParserResult | TurnAnswerParserResult;

export interface TurnBuilderSlotCandidate {
  slot_id: ScoreSlotId;
  status: SlotStatus;
  canonical_question_text: string;
  prompt_intent: string;
  optional_note_hint: string;
  chief_complaint_match: boolean;
}

export interface TurnBuilderInput {
  turn_index: number;
  selected_category_id: CategoryId;
  category_label: string;
  category_description: string;
  chief_complaint_summary: string;
  previous_answer_summary: string;
  previous_feedback_hint: string;
  answer_mode: AnswerMode;
  options: string[];
  candidate_slots: TurnBuilderSlotCandidate[];
}

export interface TurnBuilderResult {
  feedback: string;
  question_text: string;
  options: string[];
  selected_category_id: CategoryId;
  selected_slot_id: ScoreSlotId | null;
  optional_note_hint: string;
}

export type TurnPhase = "main" | "safety_check";

export interface CurrentTurnState {
  phase: TurnPhase;
  displayLabel: string;
  turnNumber: number;
  selectedCategoryId: CategoryId;
  selectedSlotId: ScoreSlotId | null;
  feedback: string;
  questionText: string;
  options: string[];
  optionalNoteHint: string;
  candidateSlotIds: ScoreSlotId[];
}

export interface SafetyCheckState {
  selectedOption: number;
  selectedLabel: string;
  freeTextSummary: string;
  rawMessage: string;
  redFlagHint: boolean;
  redFlagReason: string;
  confidence: ConfidenceLevel;
  answeredAt: string;
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

export interface ScoreSlotState {
  slotId: ScoreSlotId;
  hiddenScoreKey: QuestionId;
  value: 0 | 1 | 2 | 3 | 4 | null;
  status: SlotStatus;
  confidence: ConfidenceLevel;
  evidence: string;
  sourceTurn: number | null;
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
  safety_check_summary: string;
  confirmed_count: number;
  total_slots: number;
}

export interface QuestionProgress {
  current: number;
  total: number;
  percent: number;
}

export interface KanpoSessionSnapshot {
  answers: AnswerItem[];
  currentIndex: number;
  feedbackHistory: string[];
  finalReportText: string;
  updatedAt: string;
  chiefComplaintInput: string;
  chiefComplaintSummary: string;
  chiefComplaintCategoryHints: ChiefComplaintCategoryHint[];
  scoreSlotStates: Partial<Record<ScoreSlotId, ScoreSlotState>>;
  lastCategoryId: CategoryId | null;
  currentTurn: CurrentTurnState | null;
  safetyCheck: SafetyCheckState | null;
  freeTextHistory: string[];
}

export interface KanpoSessionState extends KanpoSessionSnapshot {
  undoStack: KanpoSessionSnapshot[];
}
