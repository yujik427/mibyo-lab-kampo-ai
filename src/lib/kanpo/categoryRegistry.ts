import type { CategoryDefinition, CategoryId } from "./types";

export const INTERVIEW_MAX_TURNS = 20;
export const POST_INTERVIEW_SAFETY_TURN = INTERVIEW_MAX_TURNS + 1;

export const CATEGORY_REGISTRY = [
  {
    id: "sleep_recovery",
    label: "睡眠・回復力",
    description: "朝の疲労感、動くと消耗する感じ、食後の眠気から回復力をみるカテゴリです。",
    phase: "early",
    required: true,
    scoreSlotIds: [
      "fatigue_on_waking",
      "exertional_fatigue",
      "post_meal_sleepiness",
    ],
    targetTurnWindow: [1, 6],
    chiefComplaintBiasEligible: true,
    chiefComplaintHintKeywords: [
      "疲れ",
      "だるい",
      "しんどい",
      "回復しない",
      "朝つらい",
      "眠い",
      "起きられない",
    ],
  },
  {
    id: "stress_emotion",
    label: "ストレス反応",
    description: "ため息や張り感、ストレスでの胃腸の乱れなど、気の巡りの乱れをみるカテゴリです。",
    phase: "early",
    required: true,
    scoreSlotIds: [
      "sighing",
      "stress_bloating",
      "stress_digestive_disruption",
    ],
    targetTurnWindow: [1, 8],
    chiefComplaintBiasEligible: true,
    chiefComplaintHintKeywords: [
      "ストレス",
      "緊張",
      "イライラ",
      "ため息",
      "張る",
      "食欲が乱れる",
      "胃腸が乱れる",
    ],
  },
  {
    id: "qi_flow",
    label: "気の巡り・上逆",
    description: "ゲップやムカつき、喉や胸のつかえ感など、気逆の材料を集めるカテゴリです。",
    phase: "core",
    required: true,
    scoreSlotIds: [
      "belching_nausea",
      "throat_chest_stuck",
    ],
    targetTurnWindow: [2, 10],
    chiefComplaintBiasEligible: true,
    chiefComplaintHintKeywords: [
      "ムカムカ",
      "吐き気",
      "ゲップ",
      "つかえる",
      "胸が苦しい",
      "喉がつまる",
    ],
  },
  {
    id: "blood_state",
    label: "血の状態",
    description: "立ちくらみ、目の疲れ、固定痛、くすみなど、血虚と瘀血の材料を集めるカテゴリです。",
    phase: "core",
    required: true,
    scoreSlotIds: [
      "orthostatic_dizziness",
      "eye_fatigue_blur",
      "fixed_pain_stiffness",
      "dark_complexion_dark_lips",
    ],
    targetTurnWindow: [4, 14],
    chiefComplaintBiasEligible: true,
    chiefComplaintHintKeywords: [
      "立ちくらみ",
      "ふらつき",
      "目が疲れる",
      "目がかすむ",
      "こり",
      "痛み",
      "くすみ",
      "クマ",
    ],
  },
  {
    id: "water_balance",
    label: "水分バランス",
    description: "むくみ、頭重感、湿気による悪化、めまい感から水滞や湿の偏りをみるカテゴリです。",
    phase: "late",
    required: true,
    scoreSlotIds: [
      "lower_body_edema_heavy",
      "upper_body_heavy_head",
      "humidity_sensitive",
      "vertigo_heavy_motion",
    ],
    targetTurnWindow: [6, 18],
    chiefComplaintBiasEligible: true,
    chiefComplaintHintKeywords: [
      "むくみ",
      "重だるい",
      "頭が重い",
      "湿気",
      "雨の日",
      "めまい",
      "乗り物酔い",
    ],
  },
  {
    id: "dry_damp_balance",
    label: "乾燥・燥湿",
    description: "のどや口の乾き、皮膚乾燥、便の乾き、夕方の乾燥感から津液不足と燥湿をみるカテゴリです。",
    phase: "late",
    required: true,
    scoreSlotIds: [
      "mouth_throat_dryness",
      "lower_body_skin_dryness",
      "hard_dry_stool",
      "evening_upper_dryness",
    ],
    targetTurnWindow: [6, 18],
    chiefComplaintBiasEligible: true,
    chiefComplaintHintKeywords: [
      "乾燥",
      "乾き",
      "のどが乾く",
      "口が乾く",
      "便秘",
      "便が硬い",
      "肌が乾く",
    ],
  },
  {
    id: "safety_check",
    label: "安全確認",
    description: "強い痛みや急な悪化などの赤旗症状を、本編20ターン後に再確認するカテゴリです。",
    phase: "safety",
    required: false,
    scoreSlotIds: [],
    targetTurnWindow: [POST_INTERVIEW_SAFETY_TURN, POST_INTERVIEW_SAFETY_TURN],
    chiefComplaintBiasEligible: false,
    chiefComplaintHintKeywords: [
      "強い痛み",
      "急に悪化",
      "出血",
      "発熱",
      "息苦しい",
      "意識が遠のく",
    ],
  },
] as const satisfies readonly CategoryDefinition[];

export const CATEGORY_IDS = CATEGORY_REGISTRY.map((category) => category.id);

export const CATEGORY_REGISTRY_BY_ID = Object.fromEntries(
  CATEGORY_REGISTRY.map((category) => [category.id, category]),
) as Record<CategoryId, (typeof CATEGORY_REGISTRY)[number]>;

export function getCategoryDefinition(categoryId: CategoryId) {
  return CATEGORY_REGISTRY_BY_ID[categoryId];
}

export function getRequiredCategories() {
  return CATEGORY_REGISTRY.filter((category) => category.required);
}
