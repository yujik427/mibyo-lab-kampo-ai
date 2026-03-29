import type { ChiefComplaintCategoryHint, ScoreSlotId } from "./types";

interface ChiefComplaintQuestionOverride {
  slotId: ScoreSlotId;
  questionText: string;
  preserveIfIncludes?: readonly string[];
}

interface ChiefComplaintGroupDefinition {
  id: string;
  label: string;
  keywords: readonly string[];
  categoryWeights: Partial<Record<ChiefComplaintCategoryHint, number>>;
  categoryKeywords?: Partial<Record<ChiefComplaintCategoryHint, readonly string[]>>;
  slotKeywords?: Partial<Record<ScoreSlotId, readonly string[]>>;
  questionOverrides?: readonly ChiefComplaintQuestionOverride[];
}

export const CHIEF_COMPLAINT_GROUPS = [
  {
    id: "upper_airway_congestion",
    label: "上気道のつまる系",
    keywords: [
      "鼻づまり",
      "鼻詰まり",
      "鼻がつまる",
      "鼻が詰まる",
      "鼻水",
      "後鼻漏",
      "副鼻腔",
      "鼻の奥が重い",
      "花粉",
      "くしゃみ",
      "アレルギー性鼻炎",
    ],
    categoryWeights: {
      water_balance: 28,
      qi_flow: 18,
      dry_damp_balance: 8,
    },
    categoryKeywords: {
      water_balance: ["鼻づまり", "鼻水", "後鼻漏", "副鼻腔", "花粉", "鼻の奥が重い"],
      qi_flow: ["喉に落ちる", "上の方がつまる", "鼻から喉に落ちる"],
    },
    slotKeywords: {
      upper_body_heavy_head: [
        "鼻づまり",
        "鼻詰まり",
        "鼻がつまる",
        "鼻が詰まる",
        "鼻水",
        "後鼻漏",
        "副鼻腔",
        "鼻の奥が重い",
        "花粉",
      ],
      throat_chest_stuck: ["後鼻漏", "鼻から喉に落ちる", "上の方がつまる", "喉に落ちる"],
    },
    questionOverrides: [
      {
        slotId: "upper_body_heavy_head",
        questionText: "鼻づまりがあるとき、頭が重い・すっきりしない感じもありますか。",
        preserveIfIncludes: ["鼻"],
      },
      {
        slotId: "throat_chest_stuck",
        questionText: "鼻づまりとあわせて、喉のつかえ感や上の方がつまる感じも出やすいですか。",
        preserveIfIncludes: ["鼻", "喉"],
      },
    ],
  },
  {
    id: "upper_airway_dryness",
    label: "上気道の乾く系",
    keywords: [
      "鼻が乾く",
      "鼻の乾き",
      "のどが乾く",
      "喉が乾く",
      "口が乾く",
      "口渇",
      "乾いてヒリヒリ",
      "いがらっぽい",
      "乾燥してつらい",
    ],
    categoryWeights: {
      dry_damp_balance: 28,
      qi_flow: 8,
      blood_state: 6,
    },
    categoryKeywords: {
      dry_damp_balance: ["鼻の乾き", "のどの乾き", "口の乾き", "ヒリヒリする"],
      blood_state: ["夕方に乾く", "目が乾く"],
    },
    slotKeywords: {
      mouth_throat_dryness: [
        "鼻が乾く",
        "鼻の乾き",
        "のどが乾く",
        "喉が乾く",
        "口が乾く",
        "口渇",
        "いがらっぽい",
      ],
      evening_upper_dryness: ["夕方に乾く", "夜に乾く", "目が乾く", "のどが乾く"],
      eye_fatigue_blur: ["目が乾く", "夕方に目が乾く"],
    },
    questionOverrides: [
      {
        slotId: "mouth_throat_dryness",
        questionText: "鼻やのど、口まわりが乾きやすい感じはありますか。",
        preserveIfIncludes: ["鼻", "のど", "喉", "口"],
      },
      {
        slotId: "evening_upper_dryness",
        questionText: "夕方から夜にかけて、目やのど、鼻まわりの乾きが強くなりやすいですか。",
        preserveIfIncludes: ["夕方", "夜", "乾"],
      },
    ],
  },
  {
    id: "throat_chest_stuck",
    label: "喉・胸のつかえ系",
    keywords: [
      "喉の違和感",
      "のどの違和感",
      "喉がつかえる",
      "喉がつまる",
      "胸がつかえる",
      "飲み込みにくい",
      "上の方がつまる",
      "胸苦しい",
    ],
    categoryWeights: {
      qi_flow: 28,
      stress_emotion: 10,
      dry_damp_balance: 8,
    },
    categoryKeywords: {
      qi_flow: ["喉の違和感", "喉がつかえる", "胸がつかえる", "飲み込みにくい"],
      stress_emotion: ["緊張でつかえる", "ストレスでつかえる"],
    },
    slotKeywords: {
      throat_chest_stuck: [
        "喉の違和感",
        "のどの違和感",
        "喉がつかえる",
        "喉がつまる",
        "胸がつかえる",
        "飲み込みにくい",
        "胸苦しい",
      ],
      stress_bloating: ["胸が張る", "圧迫感", "つまる感じ"],
    },
    questionOverrides: [
      {
        slotId: "throat_chest_stuck",
        questionText: "喉や胸のつかえ感は、どれくらいありますか。",
        preserveIfIncludes: ["喉", "胸", "つかえ"],
      },
    ],
  },
  {
    id: "stomach_rebellion",
    label: "胃の上逆・ムカつき系",
    keywords: [
      "胃がムカムカ",
      "ムカムカする",
      "吐き気っぽい",
      "吐き気",
      "ゲップ",
      "食後に気持ち悪い",
      "胃が上がる",
      "込み上げる",
    ],
    categoryWeights: {
      qi_flow: 30,
      stress_emotion: 8,
    },
    categoryKeywords: {
      qi_flow: ["胃がムカムカ", "吐き気", "ゲップ", "食後に気持ち悪い"],
    },
    slotKeywords: {
      belching_nausea: [
        "胃がムカムカ",
        "ムカムカする",
        "吐き気っぽい",
        "吐き気",
        "ゲップ",
        "食後に気持ち悪い",
      ],
    },
    questionOverrides: [
      {
        slotId: "belching_nausea",
        questionText: "胃のムカつきやゲップっぽさは、どれくらいありますか。",
        preserveIfIncludes: ["胃", "ムカ", "ゲップ", "吐き"],
      },
    ],
  },
  {
    id: "digestive_disruption",
    label: "胃腸の乱れ系",
    keywords: [
      "食欲が安定しない",
      "食欲にむらがある",
      "食欲が落ちる",
      "ストレスで胃腸が乱れる",
      "緊張で食べられない",
      "胃が重い",
      "食後に眠い",
      "食後にだるい",
    ],
    categoryWeights: {
      stress_emotion: 24,
      sleep_recovery: 14,
      qi_flow: 12,
    },
    categoryKeywords: {
      stress_emotion: ["ストレスで胃腸が乱れる", "緊張で食べられない", "食欲が安定しない"],
      sleep_recovery: ["食後に眠い", "食後にだるい"],
    },
    slotKeywords: {
      stress_digestive_disruption: [
        "食欲が安定しない",
        "食欲にむらがある",
        "食欲が落ちる",
        "ストレスで胃腸が乱れる",
        "緊張で食べられない",
        "胃が重い",
      ],
      post_meal_sleepiness: ["食後に眠い", "食後にだるい", "食べると眠い", "食べると重い"],
    },
    questionOverrides: [
      {
        slotId: "stress_digestive_disruption",
        questionText: "ストレスや緊張がかかると、食欲や胃腸の調子が乱れやすいですか。",
        preserveIfIncludes: ["食欲", "胃腸", "ストレス", "緊張"],
      },
      {
        slotId: "post_meal_sleepiness",
        questionText: "食後に眠気やだるさが強く出やすいですか。",
        preserveIfIncludes: ["食後", "眠気", "だる"],
      },
    ],
  },
  {
    id: "fatigue_recovery",
    label: "疲労・回復不足系",
    keywords: [
      "朝からだるい",
      "疲れが抜けない",
      "寝ても疲れる",
      "回復しない",
      "少し動くとしんどい",
      "消耗しやすい",
      "体力がない",
      "ずっとだるい",
    ],
    categoryWeights: {
      sleep_recovery: 30,
      water_balance: 8,
    },
    categoryKeywords: {
      sleep_recovery: [
        "朝からだるい",
        "疲れが抜けない",
        "寝ても疲れる",
        "少し動くとしんどい",
      ],
    },
    slotKeywords: {
      fatigue_on_waking: ["朝からだるい", "疲れが抜けない", "寝ても疲れる", "回復しない"],
      exertional_fatigue: ["少し動くとしんどい", "消耗しやすい", "体力がない"],
    },
    questionOverrides: [
      {
        slotId: "fatigue_on_waking",
        questionText: "朝起きた時点で、疲れが残っている感じはありますか。",
        preserveIfIncludes: ["朝", "疲れ"],
      },
      {
        slotId: "exertional_fatigue",
        questionText: "少し動いただけでも、しんどさが出やすいですか。",
        preserveIfIncludes: ["動", "しんど", "疲れ"],
      },
    ],
  },
  {
    id: "stress_stagnation",
    label: "ストレス・気分停滞系",
    keywords: [
      "ため息",
      "イライラ",
      "気分がつかえる",
      "胸やお腹が張る",
      "張る感じ",
      "緊張しやすい",
      "気持ちが詰まる",
    ],
    categoryWeights: {
      stress_emotion: 28,
      qi_flow: 12,
    },
    categoryKeywords: {
      stress_emotion: ["ため息", "イライラ", "胸やお腹が張る", "気持ちが詰まる"],
      qi_flow: ["緊張でつかえる", "上に上がる感じ"],
    },
    slotKeywords: {
      sighing: ["ため息", "息が漏れる", "気分がつかえる"],
      stress_bloating: ["胸やお腹が張る", "張る感じ", "圧迫感", "イライラで張る"],
      stress_digestive_disruption: ["ストレスで胃腸が乱れる", "緊張しやすい"],
    },
    questionOverrides: [
      {
        slotId: "stress_bloating",
        questionText: "ストレスがかかったとき、胸やお腹が張る感じはありますか。",
        preserveIfIncludes: ["胸", "お腹", "張"],
      },
      {
        slotId: "sighing",
        questionText: "ため息が増えたと感じることはありますか。",
        preserveIfIncludes: ["ため息"],
      },
    ],
  },
  {
    id: "dizziness_head_heavy",
    label: "めまい・頭重系",
    keywords: [
      "めまい",
      "ふらつく",
      "立ちくらみ",
      "頭が重い",
      "頭重",
      "乗り物酔いみたい",
      "ふわふわ",
      "クラッとする",
    ],
    categoryWeights: {
      water_balance: 22,
      blood_state: 20,
    },
    categoryKeywords: {
      water_balance: ["めまい", "頭が重い", "頭重", "乗り物酔いみたい", "ふわふわ"],
      blood_state: ["立ちくらみ", "クラッとする", "ふらつく"],
    },
    slotKeywords: {
      vertigo_heavy_motion: [
        "めまい",
        "頭重",
        "頭が重い",
        "乗り物酔いみたい",
        "ふわふわ",
        "酔いやすい",
      ],
      orthostatic_dizziness: ["立ちくらみ", "クラッとする", "ふらつく"],
      upper_body_heavy_head: ["頭が重い", "すっきりしない", "ぼんやりする"],
    },
    questionOverrides: [
      {
        slotId: "vertigo_heavy_motion",
        questionText: "めまいや頭の重さ、酔いやすい感じはありますか。",
        preserveIfIncludes: ["めまい", "頭", "酔"],
      },
      {
        slotId: "orthostatic_dizziness",
        questionText: "立ち上がったときに、クラッとしたりふらついたりしやすいですか。",
        preserveIfIncludes: ["立ち上", "ふらつ", "クラッ"],
      },
    ],
  },
  {
    id: "edema_dampness",
    label: "むくみ・水分停滞系",
    keywords: [
      "脚がむくむ",
      "足首がむくむ",
      "まぶたがむくむ",
      "体が重だるい",
      "湿気で悪化",
      "雨の日につらい",
      "梅雨に不調",
      "むくみやすい",
    ],
    categoryWeights: {
      water_balance: 28,
      sleep_recovery: 8,
    },
    categoryKeywords: {
      water_balance: ["脚がむくむ", "足首がむくむ", "まぶたがむくむ", "湿気で悪化", "雨の日につらい"],
    },
    slotKeywords: {
      lower_body_edema_heavy: ["脚がむくむ", "足首がむくむ", "下半身が重い", "夕方に靴がきつい"],
      upper_body_heavy_head: ["まぶたがむくむ", "上半身が重い", "頭が重い"],
      humidity_sensitive: ["湿気で悪化", "雨の日につらい", "梅雨に不調", "天気で悪化"],
    },
    questionOverrides: [
      {
        slotId: "lower_body_edema_heavy",
        questionText: "脚や足首のむくみ、下半身の重だるさはありますか。",
        preserveIfIncludes: ["脚", "足首", "むくみ"],
      },
      {
        slotId: "humidity_sensitive",
        questionText: "雨の日や湿気の多い日に、不調が強くなりやすいですか。",
        preserveIfIncludes: ["雨", "湿気"],
      },
    ],
  },
  {
    id: "dryness_blood_deficiency",
    label: "乾燥・血虚寄り系",
    keywords: [
      "目が乾く",
      "肌が乾く",
      "便が硬い",
      "コロコロ便",
      "夕方に乾きやすい",
      "かかとが乾く",
      "すねが乾く",
      "唇が乾く",
    ],
    categoryWeights: {
      dry_damp_balance: 26,
      blood_state: 12,
    },
    categoryKeywords: {
      dry_damp_balance: ["目が乾く", "肌が乾く", "便が硬い", "コロコロ便", "夕方に乾きやすい"],
      blood_state: ["夕方に目が疲れる", "目がしょぼしょぼ"],
    },
    slotKeywords: {
      evening_upper_dryness: [
        "目が乾く",
        "目と喉が乾く",
        "夕方になると目と喉が乾く",
        "夕方に乾きやすい",
        "夕方になると乾く",
        "夕方",
        "夜に乾燥する",
        "夜に乾く",
      ],
      lower_body_skin_dryness: ["肌が乾く", "かかとが乾く", "すねが乾く", "粉をふく"],
      hard_dry_stool: ["便が硬い", "コロコロ便", "便秘"],
      eye_fatigue_blur: ["夕方に目が疲れる", "目がしょぼしょぼ", "目が乾く"],
    },
    questionOverrides: [
      {
        slotId: "evening_upper_dryness",
        questionText: "夕方から夜にかけて、目やのどの乾きが強くなりやすいですか。",
        preserveIfIncludes: ["夕方", "夜", "乾"],
      },
      {
        slotId: "hard_dry_stool",
        questionText: "便が硬い、またはコロコロした便になりやすいですか。",
        preserveIfIncludes: ["便", "コロコロ"],
      },
    ],
  },
  {
    id: "circulation_oketsu",
    label: "巡り・瘀血寄り系",
    keywords: [
      "同じ場所のこり",
      "長引く痛み",
      "肩こり",
      "首こり",
      "腰痛",
      "くすみ",
      "クマ",
      "唇が暗い",
      "血色が悪い",
    ],
    categoryWeights: {
      blood_state: 28,
      stress_emotion: 8,
    },
    categoryKeywords: {
      blood_state: ["同じ場所のこり", "長引く痛み", "くすみ", "クマ", "唇が暗い", "血色が悪い"],
      stress_emotion: ["張って固まる", "ストレスでこわばる"],
    },
    slotKeywords: {
      fixed_pain_stiffness: ["同じ場所のこり", "長引く痛み", "肩こり", "首こり", "腰痛"],
      dark_complexion_dark_lips: ["くすみ", "クマ", "唇が暗い", "血色が悪い"],
    },
    questionOverrides: [
      {
        slotId: "fixed_pain_stiffness",
        questionText: "同じ場所のこりや痛みが長引きやすいですか。",
        preserveIfIncludes: ["こり", "痛み"],
      },
      {
        slotId: "dark_complexion_dark_lips",
        questionText: "顔色のくすみやクマ、唇の暗さが気になることはありますか。",
        preserveIfIncludes: ["くすみ", "クマ", "唇"],
      },
    ],
  },
] as const satisfies readonly ChiefComplaintGroupDefinition[];

function uniqueKeywords(...groups: ReadonlyArray<readonly string[]>) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const group of groups) {
    for (const keyword of group) {
      const trimmed = keyword.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      merged.push(trimmed);
    }
  }

  return merged;
}

export function countChiefComplaintKeywordMatches(source: string, keywords: readonly string[]) {
  const normalized = source.trim();
  if (!normalized) return 0;

  let score = 0;

  for (const keyword of keywords) {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) continue;

    const softenedStem = trimmedKeyword.replace(/[ぁ-ん]{1,2}$/u, "");
    const matched =
      normalized.includes(trimmedKeyword) ||
      (softenedStem.length >= 2 && normalized.includes(softenedStem));

    if (matched) {
      score += Math.max(1, Math.min(4, Math.ceil(trimmedKeyword.length / 3)));
    }
  }

  return score;
}

function getMatchedChiefComplaintGroups(source: string) {
  return CHIEF_COMPLAINT_GROUPS.map((group) => ({
    group,
    matchScore: countChiefComplaintKeywordMatches(source, group.keywords),
  }))
    .filter((entry) => entry.matchScore > 0)
    .sort((left, right) => right.matchScore - left.matchScore);
}

export function buildChiefComplaintAliasWeightMap(source: string) {
  const scoreMap = new Map<ChiefComplaintCategoryHint, number>();

  for (const entry of getMatchedChiefComplaintGroups(source)) {
    for (const [categoryId, weight] of Object.entries(entry.group.categoryWeights) as Array<
      [ChiefComplaintCategoryHint, number]
    >) {
      scoreMap.set(categoryId, (scoreMap.get(categoryId) ?? 0) + entry.matchScore * weight);
    }
  }

  return scoreMap;
}

export function getChiefComplaintHintKeywordsForCategory(
  categoryId: ChiefComplaintCategoryHint,
  baseKeywords: readonly string[],
) {
  const groupKeywords = CHIEF_COMPLAINT_GROUPS.flatMap((group) => {
    const keywordsByCategory =
      group.categoryKeywords as Partial<Record<ChiefComplaintCategoryHint, readonly string[]>> | undefined;
    return keywordsByCategory?.[categoryId] ?? [];
  });
  return uniqueKeywords(baseKeywords, groupKeywords);
}

export function getChiefComplaintKeywordsForSlot(
  slotId: ScoreSlotId,
  baseKeywords: readonly string[],
) {
  const groupKeywords = CHIEF_COMPLAINT_GROUPS.flatMap((group) => {
    const keywordsBySlot =
      group.slotKeywords as Partial<Record<ScoreSlotId, readonly string[]>> | undefined;
    return keywordsBySlot?.[slotId] ?? [];
  });
  return uniqueKeywords(baseKeywords, groupKeywords);
}

export function resolveChiefComplaintQuestionText(args: {
  chiefComplaintSummary: string;
  selectedSlotId: ScoreSlotId | null;
  currentQuestion: string;
}) {
  const normalized = args.chiefComplaintSummary.trim();
  const currentQuestion = args.currentQuestion.trim();

  if (!normalized || !args.selectedSlotId) {
    return currentQuestion;
  }

  for (const entry of getMatchedChiefComplaintGroups(normalized)) {
    const override = entry.group.questionOverrides?.find(
      (candidate) => candidate.slotId === args.selectedSlotId,
    );
    if (!override) continue;

    if (override.preserveIfIncludes?.some((token) => currentQuestion.includes(token))) {
      return currentQuestion;
    }

    return override.questionText;
  }

  return currentQuestion;
}
