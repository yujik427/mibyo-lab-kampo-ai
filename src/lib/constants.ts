import type { DiagnosisOption, DiagnosisQuestion } from "./types";

export const AVATAR_SRC = "/avatars/Kampot-kun.png";
export const AVATAR_ALT = "Kampot-kun";

export const LS_USER_ID = "kampo_user_id";
export const LS_CONV_ID_FREE = "kampo_conversation_id_free";
export const LS_CONV_ID_DIAG = "kampo_conversation_id_diag_v2";
export const LS_MESSAGES_FREE = "kampo_messages_free_v1";
export const LS_MESSAGES_DIAG = "kampo_messages_diag_v2";
export const LS_MODE = "kampo_mode_v1";
export const LS_DIAG_ANSWERS = "kampo_diag_answers_v2";
export const LS_DIAG_INDEX = "kampo_diag_index_v2";
export const LS_REPORTS = "kampo_reports_v1";
export const DIAGNOSIS_ANSWER_PERIOD_LABEL = "直近2週間";

export const DIAGNOSIS_FREQUENCY_OPTIONS = [
  { value: "0", label: "0: まったくない" },
  { value: "1", label: "1: ほとんどない" },
  { value: "2", label: "2: ときどきある" },
  { value: "3", label: "3: よくある" },
  { value: "4", label: "4: ほぼ毎日ある" },
] as const satisfies readonly DiagnosisOption[];

export const FREE_WELCOME_MESSAGE =
  "こんにちは。ご利用いただきありがとうございます😊🌿\nまず最初に、年齢と性別を教えてください。\n例：35歳・男性 / 30代・女性\n\n（このあと全20問で、体調や体質の傾向を漢方的な視点で整理していきます。正解・不正解はありません。※本チャットは医療行為・診断を目的としたものではありません。体調に強い不安がある場合は医療機関にご相談ください。）";

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: "q1",
    question: "朝起きたとき、寝ても疲れが残っていると感じることがありますか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q2",
    question: "少し動いただけでも、疲れやすい・しんどいと感じることがありますか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q3",
    question: "最近、ため息をつくことが増えたと感じますか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q4",
    question: "ストレスがかかると、胸やお腹が張る感じが出やすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q5",
    question: "ゲップが出やすい、または胃がムカムカしやすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q6",
    question: "緊張すると、喉につかえる感じや胸のつかえ感が出やすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q7",
    question: "立ち上がったときに、クラッとしたりふらついたりすることがありますか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q8",
    question: "目が疲れやすい、または目がかすみやすいと感じますか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q9",
    question: "肩・首・腰など、同じ場所のこりや痛みが長引きやすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q10",
    question: "顔色のくすみ、目の下のクマ、唇の暗さが気になることがありますか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q11",
    question: "脚や足首がむくみやすい、下半身が重だるいと感じやすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q12",
    question: "頭が重い、すっきりしない、上半身が重だるいと感じることが多いですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q13",
    question: "口やのどが乾きやすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q14",
    question: "すね・足首・かかとなど、下半身の皮膚が乾燥しやすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q15",
    question: "食後に、強い眠気やだるさが出やすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q16",
    question: "ストレスがかかると、食欲や胃腸の調子が乱れやすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q17",
    question: "雨の日や湿気の多い日に、不調が強くなりやすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q18",
    question: "便が硬い、またはコロコロした便になりやすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q19",
    question: "めまい、頭の重さ、乗り物酔いのような不快感が出やすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
  {
    id: "q20",
    question: "夕方から夜にかけて、目やのどの乾き、上半身の乾燥感が出やすいですか。",
    options: [...DIAGNOSIS_FREQUENCY_OPTIONS],
  },
];
