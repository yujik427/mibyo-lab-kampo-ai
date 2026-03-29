import type {
  CategoryId,
  QuestionId,
  ScoreSlotDefinition,
  ScoreSlotId,
  ScoreSlotState,
  TurnBuilderSlotCandidate,
} from "./types";
import {
  countChiefComplaintKeywordMatches,
  getChiefComplaintKeywordsForSlot,
} from "./chiefComplaintMaster";

type ScoreCategoryId = Exclude<CategoryId, "safety_check">;
type ScoreSlotStateLike = Pick<ScoreSlotState, "status"> | ScoreSlotState;

export const SCORE_SLOT_REGISTRY = [
  {
    id: "fatigue_on_waking",
    hiddenScoreKey: "Q01",
    categoryId: "sleep_recovery",
    label: "朝の疲労残り",
    canonicalQuestionText: "朝起きたとき、寝ても疲れが残っていると感じることがありますか。",
    promptIntent: "朝の時点で回復しきっていない感じがどれくらいあるかを、やさしい言い回しで確かめる。",
    optionalNoteHint: "朝に特につらい感じ方があれば書いてください。",
    bodyRegion: "whole",
    chiefComplaintKeywords: ["朝つらい", "起きても疲れる", "寝ても回復しない", "朝だるい"],
    mainScoreLinks: [{ target: "気虚", weight: 1.0 }],
    subScoreLinks: [],
  },
  {
    id: "exertional_fatigue",
    hiddenScoreKey: "Q02",
    categoryId: "sleep_recovery",
    label: "少し動くと消耗する",
    canonicalQuestionText: "少し動いただけでも、疲れやすい・しんどいと感じることがありますか。",
    promptIntent: "少しの活動でも消耗しやすいかを、生活場面に寄せて聞く。",
    optionalNoteHint: "どんな動きでしんどさが出やすいか書いてください。",
    bodyRegion: "whole",
    chiefComplaintKeywords: ["疲れやすい", "体力がない", "少し動くとしんどい", "消耗しやすい"],
    mainScoreLinks: [{ target: "気虚", weight: 1.0 }],
    subScoreLinks: [],
  },
  {
    id: "sighing",
    hiddenScoreKey: "Q03",
    categoryId: "stress_emotion",
    label: "ため息の増加",
    canonicalQuestionText: "最近、ため息をつくことが増えたと感じますか。",
    promptIntent: "気の巡りの滞りとして、ため息が増えていないかを自然に聞く。",
    optionalNoteHint: "増えやすい場面や気分の変化があれば書いてください。",
    bodyRegion: "whole",
    chiefComplaintKeywords: ["ため息", "気分が詰まる", "ストレスで苦しい", "息が漏れる"],
    mainScoreLinks: [{ target: "気滞", weight: 1.0 }],
    subScoreLinks: [],
  },
  {
    id: "stress_bloating",
    hiddenScoreKey: "Q04",
    categoryId: "stress_emotion",
    label: "ストレス時の胸腹の張り",
    canonicalQuestionText: "ストレスがかかると、胸やお腹が張る感じが出やすいですか。",
    promptIntent: "ストレス時の胸やお腹の張り感を、体感として答えやすく聞く。",
    optionalNoteHint: "張り感が出やすい場面や時間帯があれば書いてください。",
    bodyRegion: "whole",
    chiefComplaintKeywords: ["胸が張る", "お腹が張る", "ストレスで張る", "圧迫感"],
    mainScoreLinks: [
      { target: "気滞", weight: 1.0 },
      { target: "気逆", weight: 0.5 },
    ],
    subScoreLinks: [],
  },
  {
    id: "belching_nausea",
    hiddenScoreKey: "Q05",
    categoryId: "qi_flow",
    label: "ゲップ・ムカつき",
    canonicalQuestionText: "ゲップが出やすい、または胃がムカムカしやすいですか。",
    promptIntent: "胃の上逆やムカつき感を、食後や緊張時の実感として聞く。",
    optionalNoteHint: "食後や緊張時など、出やすいきっかけがあれば書いてください。",
    bodyRegion: "upper",
    chiefComplaintKeywords: ["ゲップ", "ムカムカ", "胃が気持ち悪い", "吐き気"],
    mainScoreLinks: [{ target: "気逆", weight: 1.0 }],
    subScoreLinks: [],
  },
  {
    id: "throat_chest_stuck",
    hiddenScoreKey: "Q06",
    categoryId: "qi_flow",
    label: "喉や胸のつかえ",
    canonicalQuestionText: "緊張すると、喉につかえる感じや胸のつかえ感が出やすいですか。",
    promptIntent: "緊張時の喉・胸のつかえ感を、漢方用語を使わずに聞く。",
    optionalNoteHint: "つかえ感が出やすい場面があれば書いてください。",
    bodyRegion: "upper",
    chiefComplaintKeywords: [
      "喉がつかえる",
      "胸がつかえる",
      "緊張で苦しい",
      "のみこみにくい",
      "喉の違和感",
      "のどの違和感",
      "上の方がつまる",
    ],
    mainScoreLinks: [
      { target: "気逆", weight: 1.0 },
      { target: "気滞", weight: 0.5 },
    ],
    subScoreLinks: [],
  },
  {
    id: "orthostatic_dizziness",
    hiddenScoreKey: "Q07",
    categoryId: "blood_state",
    label: "立ちくらみ・ふらつき",
    canonicalQuestionText: "立ち上がったときに、クラッとしたりふらついたりすることがありますか。",
    promptIntent: "立ち上がり時のふらつきやクラつきを日常動作の中で聞く。",
    optionalNoteHint: "起こりやすい場面や頻度があれば書いてください。",
    bodyRegion: "whole",
    chiefComplaintKeywords: ["立ちくらみ", "ふらつく", "クラッとする", "めまい"],
    mainScoreLinks: [{ target: "血虚", weight: 1.0 }],
    subScoreLinks: [],
  },
  {
    id: "eye_fatigue_blur",
    hiddenScoreKey: "Q08",
    categoryId: "blood_state",
    label: "目の疲れ・かすみ",
    canonicalQuestionText: "目が疲れやすい、または目がかすみやすいと感じますか。",
    promptIntent: "目の酷使だけでなく、夕方悪化やかすみ感も含めて聞く。",
    optionalNoteHint: "夕方に強いなど、感じ方の特徴があれば書いてください。",
    bodyRegion: "upper",
    chiefComplaintKeywords: ["目が疲れる", "目がかすむ", "夕方に見えにくい", "目がしょぼしょぼ"],
    mainScoreLinks: [
      { target: "血虚", weight: 1.0 },
      { target: "津液不足", weight: 0.5 },
    ],
    subScoreLinks: [],
  },
  {
    id: "fixed_pain_stiffness",
    hiddenScoreKey: "Q09",
    categoryId: "blood_state",
    label: "同じ場所のこり・痛み",
    canonicalQuestionText: "肩・首・腰など、同じ場所のこりや痛みが長引きやすいですか。",
    promptIntent: "固定しやすいこりや痛みを、部位と長引き方の両方で聞く。",
    optionalNoteHint: "特に気になる部位や長引き方があれば書いてください。",
    bodyRegion: "whole",
    chiefComplaintKeywords: ["肩こり", "首こり", "腰痛", "同じ場所が痛い", "長引く痛み"],
    mainScoreLinks: [
      { target: "瘀血", weight: 1.0 },
      { target: "気滞", weight: 0.5 },
    ],
    subScoreLinks: [],
  },
  {
    id: "dark_complexion_dark_lips",
    hiddenScoreKey: "Q10",
    categoryId: "blood_state",
    label: "くすみ・クマ・唇の暗さ",
    canonicalQuestionText: "顔色のくすみ、目の下のクマ、唇の暗さが気になることがありますか。",
    promptIntent: "見た目の血色低下や暗さを、自覚しやすい言葉で聞く。",
    optionalNoteHint: "特に気になる見た目の変化があれば書いてください。",
    bodyRegion: "whole",
    chiefComplaintKeywords: ["くすみ", "クマ", "唇が暗い", "血色が悪い"],
    mainScoreLinks: [
      { target: "瘀血", weight: 1.0 },
      { target: "血虚", weight: 0.5 },
    ],
    subScoreLinks: [],
  },
  {
    id: "lower_body_edema_heavy",
    hiddenScoreKey: "Q11",
    categoryId: "water_balance",
    label: "下半身のむくみ・重だるさ",
    canonicalQuestionText: "脚や足首がむくみやすい、下半身が重だるいと感じやすいですか。",
    promptIntent: "脚や足首のむくみ、夕方の重さなど下半身の水分停滞を聞く。",
    optionalNoteHint: "夕方に強いなど、むくみ方の特徴があれば書いてください。",
    bodyRegion: "lower",
    chiefComplaintKeywords: ["脚がむくむ", "足首がむくむ", "下半身が重い", "夕方に靴がきつい"],
    mainScoreLinks: [{ target: "水滞", weight: 1.0 }],
    subScoreLinks: [
      { target: "damp", role: "primary", weight: 1.0 },
      { target: "lowerDamp", role: "primary", weight: 1.0 },
      { target: "upperDamp", role: "support", weight: 0.5 },
    ],
  },
  {
    id: "upper_body_heavy_head",
    hiddenScoreKey: "Q12",
    categoryId: "water_balance",
    label: "頭重・上半身の重だるさ",
    canonicalQuestionText: "頭が重い、すっきりしない、上半身が重だるいと感じることが多いですか。",
    promptIntent: "頭重感やすっきりしない感じを、上半身の重だるさとして聞く。",
    optionalNoteHint: "頭重感が出やすい時間帯やきっかけがあれば書いてください。",
    bodyRegion: "upper",
    chiefComplaintKeywords: [
      "頭が重い",
      "すっきりしない",
      "上半身が重い",
      "ぼんやりする",
      "鼻づまり",
      "鼻詰まり",
      "鼻がつまる",
      "鼻が詰まる",
      "鼻水",
      "副鼻腔",
      "後鼻漏",
      "花粉",
    ],
    mainScoreLinks: [{ target: "水滞", weight: 1.0 }],
    subScoreLinks: [
      { target: "damp", role: "primary", weight: 1.0 },
      { target: "upperDamp", role: "primary", weight: 1.0 },
      { target: "lowerDamp", role: "support", weight: 0.5 },
    ],
  },
  {
    id: "mouth_throat_dryness",
    hiddenScoreKey: "Q13",
    categoryId: "dry_damp_balance",
    label: "口・のどの乾き",
    canonicalQuestionText: "口やのどが乾きやすいですか。",
    promptIntent: "口やのどの乾きや水分不足感を、日中の感覚として聞く。",
    optionalNoteHint: "乾きやすい時間帯や飲み物が欲しくなる感じがあれば書いてください。",
    bodyRegion: "upper",
    chiefComplaintKeywords: [
      "のどが乾く",
      "口が乾く",
      "口渇",
      "水分がほしい",
      "鼻が乾く",
      "鼻の乾き",
      "喉が乾く",
    ],
    mainScoreLinks: [{ target: "津液不足", weight: 1.0 }],
    subScoreLinks: [
      { target: "dry", role: "primary", weight: 1.0 },
      { target: "upperDry", role: "primary", weight: 1.0 },
      { target: "lowerDry", role: "support", weight: 0.5 },
    ],
  },
  {
    id: "lower_body_skin_dryness",
    hiddenScoreKey: "Q14",
    categoryId: "dry_damp_balance",
    label: "下半身の皮膚乾燥",
    canonicalQuestionText: "すね・足首・かかとなど、下半身の皮膚が乾燥しやすいですか。",
    promptIntent: "すねやかかとなど下半身の乾燥を、見た目と感触の両方で聞く。",
    optionalNoteHint: "かゆみや粉をふく感じなどがあれば書いてください。",
    bodyRegion: "lower",
    chiefComplaintKeywords: ["すねが乾く", "かかとが乾く", "足首が乾燥", "粉をふく"],
    mainScoreLinks: [
      { target: "津液不足", weight: 1.0 },
      { target: "血虚", weight: 0.5 },
    ],
    subScoreLinks: [
      { target: "dry", role: "primary", weight: 1.0 },
      { target: "lowerDry", role: "primary", weight: 1.0 },
      { target: "upperDry", role: "support", weight: 0.5 },
    ],
  },
  {
    id: "post_meal_sleepiness",
    hiddenScoreKey: "Q15",
    categoryId: "sleep_recovery",
    label: "食後の眠気・だるさ",
    canonicalQuestionText: "食後に、強い眠気やだるさが出やすいですか。",
    promptIntent: "食後にガクッと眠くなるか、体が重くなるかを答えやすく聞く。",
    optionalNoteHint: "食後どれくらいで出るかや、食事量との関係があれば書いてください。",
    bodyRegion: "whole",
    chiefComplaintKeywords: ["食後に眠い", "食後にだるい", "食べると重い", "午後につらい"],
    mainScoreLinks: [
      { target: "気虚", weight: 1.0 },
      { target: "水滞", weight: 0.5 },
    ],
    subScoreLinks: [],
  },
  {
    id: "stress_digestive_disruption",
    hiddenScoreKey: "Q16",
    categoryId: "stress_emotion",
    label: "ストレスで胃腸が乱れる",
    canonicalQuestionText: "ストレスがかかると、食欲や胃腸の調子が乱れやすいですか。",
    promptIntent: "ストレスと胃腸の連動を、食欲やお腹の変化として聞く。",
    optionalNoteHint: "食欲低下や胃の重さなど、出やすい変化を書いてください。",
    bodyRegion: "whole",
    chiefComplaintKeywords: ["ストレスで胃がつらい", "食欲が落ちる", "胃腸が乱れる", "緊張で食べられない"],
    mainScoreLinks: [
      { target: "気滞", weight: 1.0 },
      { target: "気逆", weight: 0.5 },
    ],
    subScoreLinks: [],
  },
  {
    id: "humidity_sensitive",
    hiddenScoreKey: "Q17",
    categoryId: "water_balance",
    label: "湿気で悪化しやすい",
    canonicalQuestionText: "雨の日や湿気の多い日に、不調が強くなりやすいですか。",
    promptIntent: "雨や湿気で重だるさや不調が増すかを、天気との関係で聞く。",
    optionalNoteHint: "雨の日に強くなる症状があれば書いてください。",
    bodyRegion: "whole",
    chiefComplaintKeywords: ["雨の日につらい", "湿気で悪化", "天気で悪化", "梅雨に不調"],
    mainScoreLinks: [{ target: "水滞", weight: 1.0 }],
    subScoreLinks: [
      { target: "damp", role: "primary", weight: 1.0 },
      { target: "upperDamp", role: "support", weight: 0.5 },
      { target: "lowerDamp", role: "support", weight: 0.5 },
    ],
  },
  {
    id: "hard_dry_stool",
    hiddenScoreKey: "Q18",
    categoryId: "dry_damp_balance",
    label: "硬く乾いた便",
    canonicalQuestionText: "便が硬い、またはコロコロした便になりやすいですか。",
    promptIntent: "便の乾きや出にくさを、恥ずかしさが少ない表現で聞く。",
    optionalNoteHint: "便の出にくさや水分不足感があれば書いてください。",
    bodyRegion: "whole",
    chiefComplaintKeywords: ["便が硬い", "コロコロ便", "便秘", "水分不足"],
    mainScoreLinks: [{ target: "津液不足", weight: 1.0 }],
    subScoreLinks: [
      { target: "dry", role: "primary", weight: 1.0 },
      { target: "upperDry", role: "support", weight: 0.5 },
      { target: "lowerDry", role: "support", weight: 0.5 },
    ],
  },
  {
    id: "vertigo_heavy_motion",
    hiddenScoreKey: "Q19",
    categoryId: "water_balance",
    label: "めまい・頭重・酔いやすさ",
    canonicalQuestionText: "めまい、頭の重さ、乗り物酔いのような不快感が出やすいですか。",
    promptIntent: "めまい感や頭重感、酔いやすさをまとめて自然に聞く。",
    optionalNoteHint: "ふわふわ感や吐き気など、感じ方の特徴があれば書いてください。",
    bodyRegion: "upper",
    chiefComplaintKeywords: ["めまい", "頭重", "酔いやすい", "ふわふわする"],
    mainScoreLinks: [
      { target: "気逆", weight: 1.0 },
      { target: "水滞", weight: 0.5 },
    ],
    subScoreLinks: [
      { target: "damp", role: "primary", weight: 1.0 },
      { target: "upperDamp", role: "primary", weight: 1.0 },
      { target: "lowerDamp", role: "support", weight: 0.5 },
    ],
  },
  {
    id: "evening_upper_dryness",
    hiddenScoreKey: "Q20",
    categoryId: "dry_damp_balance",
    label: "夕方以降の上半身乾燥",
    canonicalQuestionText: "夕方から夜にかけて、目やのどの乾き、上半身の乾燥感が出やすいですか。",
    promptIntent: "夕方から夜にかけた乾きの強まりを、時間帯の変化として聞く。",
    optionalNoteHint: "目やのどなど、特に乾きやすい部位があれば書いてください。",
    bodyRegion: "upper",
    chiefComplaintKeywords: ["夕方に乾く", "目が乾く", "のどが乾く", "夜に乾燥する"],
    mainScoreLinks: [
      { target: "津液不足", weight: 1.0 },
      { target: "血虚", weight: 0.5 },
    ],
    subScoreLinks: [
      { target: "dry", role: "primary", weight: 1.0 },
      { target: "upperDry", role: "primary", weight: 1.0 },
      { target: "lowerDry", role: "support", weight: 0.5 },
    ],
  },
] as const satisfies readonly ScoreSlotDefinition[];

export const SCORE_SLOT_IDS = SCORE_SLOT_REGISTRY.map((slot) => slot.id);

export const SCORE_SLOT_REGISTRY_BY_ID = Object.fromEntries(
  SCORE_SLOT_REGISTRY.map((slot) => [slot.id, slot]),
) as Record<ScoreSlotId, (typeof SCORE_SLOT_REGISTRY)[number]>;

export const SCORE_SLOT_REGISTRY_BY_HIDDEN_SCORE_KEY = Object.fromEntries(
  SCORE_SLOT_REGISTRY.map((slot) => [slot.hiddenScoreKey, slot]),
) as Record<QuestionId, (typeof SCORE_SLOT_REGISTRY)[number]>;

export const SCORE_SLOTS_BY_CATEGORY: Record<
  ScoreCategoryId,
  readonly (typeof SCORE_SLOT_REGISTRY)[number][]
> = {
  sleep_recovery: SCORE_SLOT_REGISTRY.filter((slot) => slot.categoryId === "sleep_recovery"),
  stress_emotion: SCORE_SLOT_REGISTRY.filter((slot) => slot.categoryId === "stress_emotion"),
  qi_flow: SCORE_SLOT_REGISTRY.filter((slot) => slot.categoryId === "qi_flow"),
  blood_state: SCORE_SLOT_REGISTRY.filter((slot) => slot.categoryId === "blood_state"),
  water_balance: SCORE_SLOT_REGISTRY.filter((slot) => slot.categoryId === "water_balance"),
  dry_damp_balance: SCORE_SLOT_REGISTRY.filter((slot) => slot.categoryId === "dry_damp_balance"),
};

export function getScoreSlotDefinition(slotId: ScoreSlotId) {
  return SCORE_SLOT_REGISTRY_BY_ID[slotId];
}

export function getScoreSlotDefinitionByHiddenScoreKey(questionId: QuestionId) {
  return SCORE_SLOT_REGISTRY_BY_HIDDEN_SCORE_KEY[questionId];
}

export function getScoreSlotsForCategory(categoryId: ScoreCategoryId) {
  return SCORE_SLOTS_BY_CATEGORY[categoryId];
}

function getChiefComplaintKeywordMatchScore(
  summary: string,
  slotId: ScoreSlotId,
  keywords: readonly string[],
) {
  return countChiefComplaintKeywordMatches(
    summary,
    getChiefComplaintKeywordsForSlot(slotId, keywords),
  );
}

function getSlotStatus(
  scoreSlotStates: Partial<Record<ScoreSlotId, ScoreSlotStateLike>> | undefined,
  slotId: ScoreSlotId,
) {
  return scoreSlotStates?.[slotId]?.status ?? "empty";
}

export function buildTurnBuilderSlotCandidates(args: {
  categoryId: ScoreCategoryId;
  chiefComplaintSummary?: string;
  scoreSlotStates?: Partial<Record<ScoreSlotId, ScoreSlotStateLike>>;
  limit?: number;
}): TurnBuilderSlotCandidate[] {
  const slots = getScoreSlotsForCategory(args.categoryId);
  const chiefComplaintSummary = args.chiefComplaintSummary ?? "";

  const unresolvedSlots = slots.filter(
    (slot) => getSlotStatus(args.scoreSlotStates, slot.id) !== "confirmed",
  );
  const sourceSlots = unresolvedSlots.length > 0 ? unresolvedSlots : slots;

  const sortedSlots = [...sourceSlots].sort((left, right) => {
    const leftMatchScore = getChiefComplaintKeywordMatchScore(
      chiefComplaintSummary,
      left.id,
      left.chiefComplaintKeywords,
    );
    const rightMatchScore = getChiefComplaintKeywordMatchScore(
      chiefComplaintSummary,
      right.id,
      right.chiefComplaintKeywords,
    );

    if (rightMatchScore !== leftMatchScore) return rightMatchScore - leftMatchScore;
    return sourceSlots.indexOf(left) - sourceSlots.indexOf(right);
  });

  return sortedSlots.slice(0, args.limit ?? 3).map((slot) => ({
    slot_id: slot.id,
    status: getSlotStatus(args.scoreSlotStates, slot.id),
    canonical_question_text: slot.canonicalQuestionText,
    prompt_intent: slot.promptIntent,
    optional_note_hint: slot.optionalNoteHint,
    chief_complaint_match:
      getChiefComplaintKeywordMatchScore(chiefComplaintSummary, slot.id, slot.chiefComplaintKeywords) >
      0,
  }));
}
