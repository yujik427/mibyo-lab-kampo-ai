import type { Question, QuestionOption } from "./types";

export const KANPO_CHAT_OPTIONS = [
  { value: 0, label: "0 まったくない", shortLabel: "まったくない" },
  { value: 1, label: "1 ほとんどない", shortLabel: "ほとんどない" },
  { value: 2, label: "2 ときどきある", shortLabel: "ときどきある" },
  { value: 3, label: "3 よくある", shortLabel: "よくある" },
  { value: 4, label: "4 ほぼ毎日ある", shortLabel: "ほぼ毎日ある" },
] as const satisfies readonly QuestionOption[];

export const KANPO_CHAT_QUESTIONS: readonly Question[] = [
  {
    id: "Q01",
    text: "朝起きたとき、寝ても疲れが残っていると感じることがありますか。",
    options: KANPO_CHAT_OPTIONS,
    category: "energy",
  },
  {
    id: "Q02",
    text: "少し動いただけでも、疲れやすい・しんどいと感じることがありますか。",
    options: KANPO_CHAT_OPTIONS,
    category: "energy",
  },
  {
    id: "Q03",
    text: "最近、ため息をつくことが増えたと感じますか。",
    options: KANPO_CHAT_OPTIONS,
    category: "qi-flow",
  },
  {
    id: "Q04",
    text: "ストレスがかかると、胸やお腹が張る感じが出やすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "qi-flow",
  },
  {
    id: "Q05",
    text: "ゲップが出やすい、または胃がムカムカしやすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "qi-flow",
  },
  {
    id: "Q06",
    text: "緊張すると、喉につかえる感じや胸のつかえ感が出やすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "qi-flow",
  },
  {
    id: "Q07",
    text: "立ち上がったときに、クラッとしたりふらついたりすることがありますか。",
    options: KANPO_CHAT_OPTIONS,
    category: "blood",
  },
  {
    id: "Q08",
    text: "目が疲れやすい、または目がかすみやすいと感じますか。",
    options: KANPO_CHAT_OPTIONS,
    category: "blood",
  },
  {
    id: "Q09",
    text: "肩・首・腰など、同じ場所のこりや痛みが長引きやすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "blood",
  },
  {
    id: "Q10",
    text: "顔色のくすみ、目の下のクマ、唇の暗さが気になることがありますか。",
    options: KANPO_CHAT_OPTIONS,
    category: "blood",
  },
  {
    id: "Q11",
    text: "脚や足首がむくみやすい、下半身が重だるいと感じやすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "dampness",
  },
  {
    id: "Q12",
    text: "頭が重い、すっきりしない、上半身が重だるいと感じることが多いですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "dampness",
  },
  {
    id: "Q13",
    text: "口やのどが乾きやすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "dryness",
  },
  {
    id: "Q14",
    text: "すね・足首・かかとなど、下半身の皮膚が乾燥しやすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "dryness",
  },
  {
    id: "Q15",
    text: "食後に、強い眠気やだるさが出やすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "digestion",
  },
  {
    id: "Q16",
    text: "ストレスがかかると、食欲や胃腸の調子が乱れやすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "stress",
  },
  {
    id: "Q17",
    text: "雨の日や湿気の多い日に、不調が強くなりやすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "dampness",
  },
  {
    id: "Q18",
    text: "便が硬い、またはコロコロした便になりやすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "dryness",
  },
  {
    id: "Q19",
    text: "めまい、頭の重さ、乗り物酔いのような不快感が出やすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "dampness",
  },
  {
    id: "Q20",
    text: "夕方から夜にかけて、目やのどの乾き、上半身の乾燥感が出やすいですか。",
    options: KANPO_CHAT_OPTIONS,
    category: "dryness",
  },
] as const;

export const KANPO_CHAT_TOTAL_QUESTIONS = KANPO_CHAT_QUESTIONS.length;
export const KANPO_CHAT_STORAGE_KEY = "kanpo_ai_direct_session_v3";
export const KANPO_CHAT_REPORT_STORAGE_KEY = "kanpo_ai_direct_reports_v1";

export function getKanpoQuestionById(questionId: string) {
  return KANPO_CHAT_QUESTIONS.find((question) => question.id === questionId) ?? null;
}

export function getKanpoOptionLabel(questionId: string, optionValue: number) {
  return (
    getKanpoQuestionById(questionId)?.options.find((option) => option.value === optionValue)?.label ?? ""
  );
}
