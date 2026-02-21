import type { DiagnosisQuestion } from "./types";

export const AVATAR_SRC = "/avatars/Kampot-kun.png";
export const AVATAR_ALT = "Kampot-kun";

export const LS_USER_ID = "kampo_user_id";
export const LS_CONV_ID_FREE = "kampo_conversation_id_free";
export const LS_CONV_ID_DIAG = "kampo_conversation_id_diag";
export const LS_MESSAGES_FREE = "kampo_messages_free_v1";
export const LS_MESSAGES_DIAG = "kampo_messages_diag_v1";
export const LS_MODE = "kampo_mode_v1";
export const LS_DIAG_ANSWERS = "kampo_diag_answers_v1";
export const LS_DIAG_INDEX = "kampo_diag_index_v1";
export const LS_REPORTS = "kampo_reports_v1";

export const FREE_WELCOME_MESSAGE =
  "こんにちは。ご利用いただきありがとうございます😊🌿\nまず最初に、年齢と性別を教えてください。\n例：35歳・男性 / 30代・女性\n\n（このあと全20問で、体調や体質の傾向を漢方的な視点で整理していきます。正解・不正解はありません。※本チャットは医療行為・診断を目的としたものではありません。体調に強い不安がある場合は医療機関にご相談ください。）";

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: "q1",
    question: "普段の体調はどうですか？",
    options: [
      { value: "good", label: "元気で調子が良い" },
      { value: "normal", label: "普通" },
      { value: "tired", label: "疲れやすい" },
      { value: "weak", label: "体が弱い" },
    ],
  },
  {
    id: "q2",
    question: "冷え性の症状はありますか？",
    options: [
      { value: "severe", label: "かなり冷える" },
      { value: "moderate", label: "少し冷える" },
      { value: "mild", label: "たまに冷える" },
      { value: "none", label: "冷えは感じない" },
    ],
  },
  {
    id: "q3",
    question: "のぼせやほてりの症状はありますか？",
    options: [
      { value: "often", label: "よくある" },
      { value: "sometimes", label: "たまにある" },
      { value: "rare", label: "ほとんどない" },
      { value: "none", label: "全くない" },
    ],
  },
  {
    id: "q4",
    question: "汗のかき方はどうですか？",
    options: [
      { value: "much", label: "よく汗をかく" },
      { value: "normal", label: "普通" },
      { value: "little", label: "あまり汗をかかない" },
      { value: "none", label: "ほとんど汗をかかない" },
    ],
  },
  {
    id: "q5",
    question: "食欲はどうですか？",
    options: [
      { value: "good", label: "食欲旺盛" },
      { value: "normal", label: "普通" },
      { value: "poor", label: "食欲がない" },
      { value: "irregular", label: "食欲が不安定" },
    ],
  },
  {
    id: "q6",
    question: "便通はどうですか？",
    options: [
      { value: "regular", label: "毎日規則正しい" },
      { value: "constipation", label: "便秘気味" },
      { value: "diarrhea", label: "下痢気味" },
      { value: "irregular", label: "不規則" },
    ],
  },
  {
    id: "q7",
    question: "睡眠の質はどうですか？",
    options: [
      { value: "good", label: "よく眠れる" },
      { value: "normal", label: "普通" },
      { value: "poor", label: "眠りが浅い" },
      { value: "insomnia", label: "不眠気味" },
    ],
  },
  {
    id: "q8",
    question: "ストレスを感じることは多いですか？",
    options: [
      { value: "much", label: "よく感じる" },
      { value: "sometimes", label: "たまに感じる" },
      { value: "rare", label: "あまり感じない" },
      { value: "none", label: "ほとんど感じない" },
    ],
  },
  {
    id: "q9",
    question: "肩こりや首こりの症状はありますか？",
    options: [
      { value: "severe", label: "ひどい" },
      { value: "moderate", label: "ある" },
      { value: "mild", label: "たまにある" },
      { value: "none", label: "ない" },
    ],
  },
  {
    id: "q10",
    question: "頭痛の症状はありますか？",
    options: [
      { value: "often", label: "よくある" },
      { value: "sometimes", label: "たまにある" },
      { value: "rare", label: "ほとんどない" },
      { value: "none", label: "全くない" },
    ],
  },
  {
    id: "q11",
    question: "めまいや立ちくらみはありますか？",
    options: [
      { value: "often", label: "よくある" },
      { value: "sometimes", label: "たまにある" },
      { value: "rare", label: "ほとんどない" },
      { value: "none", label: "全くない" },
    ],
  },
  {
    id: "q12",
    question: "むくみの症状はありますか？",
    options: [
      { value: "often", label: "よくある" },
      { value: "sometimes", label: "たまにある" },
      { value: "rare", label: "ほとんどない" },
      { value: "none", label: "全くない" },
    ],
  },
  {
    id: "q13",
    question: "肌の状態はどうですか？",
    options: [
      { value: "good", label: "きれい" },
      { value: "dry", label: "乾燥気味" },
      { value: "oily", label: "脂っぽい" },
      { value: "rough", label: "荒れている" },
    ],
  },
  {
    id: "q14",
    question: "生理の状態はどうですか？（女性の場合）",
    options: [
      { value: "regular", label: "規則正しい" },
      { value: "irregular", label: "不規則" },
      { value: "painful", label: "痛みがある" },
      { value: "heavy", label: "量が多い" },
      { value: "na", label: "該当しない" },
    ],
  },
  {
    id: "q15",
    question: "口の渇きは感じますか？",
    options: [
      { value: "often", label: "よく感じる" },
      { value: "sometimes", label: "たまに感じる" },
      { value: "rare", label: "ほとんど感じない" },
      { value: "none", label: "全く感じない" },
    ],
  },
  {
    id: "q16",
    question: "のどの渇きは感じますか？",
    options: [
      { value: "often", label: "よく感じる" },
      { value: "sometimes", label: "たまに感じる" },
      { value: "rare", label: "ほとんど感じない" },
      { value: "none", label: "全く感じない" },
    ],
  },
  {
    id: "q17",
    question: "イライラしやすいですか？",
    options: [
      { value: "often", label: "よくイライラする" },
      { value: "sometimes", label: "たまにイライラする" },
      { value: "rare", label: "あまりイライラしない" },
      { value: "none", label: "ほとんどイライラしない" },
    ],
  },
  {
    id: "q18",
    question: "疲れやすさはどうですか？",
    options: [
      { value: "severe", label: "とても疲れやすい" },
      { value: "moderate", label: "疲れやすい" },
      { value: "mild", label: "少し疲れやすい" },
      { value: "none", label: "疲れにくい" },
    ],
  },
  {
    id: "q19",
    question: "運動はしますか？",
    options: [
      { value: "often", label: "よくする" },
      { value: "sometimes", label: "たまにする" },
      { value: "rare", label: "ほとんどしない" },
      { value: "none", label: "全くしない" },
    ],
  },
  {
    id: "q20",
    question: "食事のバランスはどうですか？",
    options: [
      { value: "good", label: "バランスが良い" },
      { value: "normal", label: "普通" },
      { value: "poor", label: "偏りがある" },
      { value: "irregular", label: "不規則" },
    ],
  },
];
