import { getCategoryDefinition } from "../src/lib/kanpo/categoryRegistry";
import { adaptChiefComplaintQuestionText } from "../src/lib/kanpo/chief-complaint-hints";
import { buildTurnBuilderSlotCandidates } from "../src/lib/kanpo/slotRegistry";
import { selectNextCategoryId } from "../src/lib/kanpo/turnController";
import type {
  CategoryId,
  OpeningIntakeAnswerParserResult,
  ScoreSlotId,
  TurnBuilderResult,
} from "../src/lib/kanpo/types";

const baseUrl = process.env.KANPO_BASE_URL ?? "http://127.0.0.1:3002";
const defaultOptions = [
  "0 まったくない",
  "1 ほとんどない",
  "2 ときどきある",
  "3 よくある",
  "4 ほぼ毎日ある",
] as const;

type Scenario = {
  name: string;
  opening: string;
  expectedFirstCategory: CategoryId;
  expectedSlotIds: readonly ScoreSlotId[];
  expectedQuestionIncludes: readonly string[];
};

const scenarios: Scenario[] = [
  {
    name: "upper-airway-congestion",
    opening: "鼻づまりと鼻の奥の重さが続いていて、花粉の時期は特につらいです。",
    expectedFirstCategory: "water_balance",
    expectedSlotIds: ["upper_body_heavy_head"],
    expectedQuestionIncludes: ["鼻"],
  },
  {
    name: "upper-airway-dryness",
    opening: "鼻と喉が乾いてヒリヒリし、口も乾きやすいです。",
    expectedFirstCategory: "dry_damp_balance",
    expectedSlotIds: ["mouth_throat_dryness"],
    expectedQuestionIncludes: ["鼻", "のど"],
  },
  {
    name: "throat-chest-stuck",
    opening: "喉に何かつかえる感じがして、飲み込みにくさがあります。",
    expectedFirstCategory: "qi_flow",
    expectedSlotIds: ["throat_chest_stuck"],
    expectedQuestionIncludes: ["喉", "つかえ"],
  },
  {
    name: "stomach-rebellion",
    opening: "胃がムカムカして、食後はゲップと吐き気っぽさが出ます。",
    expectedFirstCategory: "qi_flow",
    expectedSlotIds: ["belching_nausea"],
    expectedQuestionIncludes: ["胃", "ムカ", "ゲップ"],
  },
  {
    name: "digestive-disruption",
    opening: "ストレスがかかると食欲が落ちて、すぐ胃腸の調子が乱れます。",
    expectedFirstCategory: "stress_emotion",
    expectedSlotIds: ["stress_digestive_disruption"],
    expectedQuestionIncludes: ["食欲", "胃腸", "ストレス"],
  },
  {
    name: "fatigue-recovery",
    opening: "朝からだるくて疲れが抜けず、少し動くだけでもしんどいです。",
    expectedFirstCategory: "sleep_recovery",
    expectedSlotIds: ["fatigue_on_waking", "exertional_fatigue"],
    expectedQuestionIncludes: ["朝", "疲れ", "しんど"],
  },
  {
    name: "stress-stagnation",
    opening: "ため息が増えて、ストレスがかかると胸とお腹が張る感じがします。",
    expectedFirstCategory: "stress_emotion",
    expectedSlotIds: ["stress_bloating", "sighing"],
    expectedQuestionIncludes: ["ため息", "胸", "お腹", "張"],
  },
  {
    name: "water-balance-dizziness",
    opening: "めまいと頭の重さがあり、乗り物酔いみたいにふわふわします。",
    expectedFirstCategory: "water_balance",
    expectedSlotIds: ["vertigo_heavy_motion", "upper_body_heavy_head"],
    expectedQuestionIncludes: ["めまい", "頭", "酔"],
  },
  {
    name: "blood-state-dizziness",
    opening: "立ち上がるとクラッとしてふらつきやすく、貧血っぽい感じがあります。",
    expectedFirstCategory: "blood_state",
    expectedSlotIds: ["orthostatic_dizziness"],
    expectedQuestionIncludes: ["立ち上", "ふらつ", "クラッ"],
  },
  {
    name: "edema-dampness",
    opening: "脚と足首がむくみやすく、雨の日や湿気の多い日は重だるさが強いです。",
    expectedFirstCategory: "water_balance",
    expectedSlotIds: ["lower_body_edema_heavy", "humidity_sensitive"],
    expectedQuestionIncludes: ["脚", "足首", "むくみ", "雨", "湿気"],
  },
  {
    name: "dryness-blood-deficiency",
    opening: "夕方になると目と喉が乾き、便も硬くなりやすいです。",
    expectedFirstCategory: "dry_damp_balance",
    expectedSlotIds: ["evening_upper_dryness", "hard_dry_stool"],
    expectedQuestionIncludes: ["夕方", "乾", "便"],
  },
  {
    name: "circulation-oketsu",
    opening: "同じ場所の首こりが長引きやすく、顔色のくすみとクマも気になります。",
    expectedFirstCategory: "blood_state",
    expectedSlotIds: ["fixed_pain_stiffness", "dark_complexion_dark_lips"],
    expectedQuestionIncludes: ["こり", "痛み", "くすみ", "クマ"],
  },
];

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as T & { error?: string; detail?: string };
  if (!response.ok) {
    throw new Error(data.detail || data.error || `HTTP ${response.status}`);
  }

  return data;
}

async function runScenario(scenario: Scenario) {
  const opening = await postJson<OpeningIntakeAnswerParserResult>("/api/kanpo/answer-parser", {
    mode: "opening_intake",
    user_message: scenario.opening,
  });

  if (opening.mode !== "opening_intake") {
    throw new Error(`[${scenario.name}] opening parser returned invalid mode`);
  }

  const firstCategory = selectNextCategoryId({
    nextTurnNumber: 1,
    lastCategoryId: null,
    chiefComplaintCategoryHints: opening.chief_complaint_category_hints,
    scoreSlotStates: {},
  });
  const category = getCategoryDefinition(firstCategory);
  const candidateSlots = buildTurnBuilderSlotCandidates({
    categoryId: firstCategory as Exclude<CategoryId, "safety_check">,
    chiefComplaintSummary: opening.chief_complaint_summary,
    scoreSlotStates: {},
    limit: 3,
  });
  const turnBuilt = await postJson<TurnBuilderResult>("/api/kanpo/turn-builder", {
    turn_index: 1,
    selected_category_id: firstCategory,
    category_label: category.label,
    category_description: category.description,
    chief_complaint_summary: opening.chief_complaint_summary,
    previous_answer_summary: "",
    previous_feedback_hint: "",
    answer_mode: "scale_0_4_with_optional_note",
    options: [...defaultOptions],
    candidate_slots: candidateSlots,
  });

  const displayedQuestion = adaptChiefComplaintQuestionText({
    chiefComplaintSummary: opening.chief_complaint_summary,
    selectedCategoryId: turnBuilt.selected_category_id,
    selectedSlotId: turnBuilt.selected_slot_id,
    questionText: turnBuilt.question_text,
  });

  return {
    scenario: scenario.name,
    openingSummary: opening.chief_complaint_summary,
    categoryHints: opening.chief_complaint_category_hints,
    firstCategory,
    firstCategoryMatched: firstCategory === scenario.expectedFirstCategory,
    selectedSlotId: turnBuilt.selected_slot_id,
    selectedSlotMatched:
      turnBuilt.selected_slot_id !== null && scenario.expectedSlotIds.includes(turnBuilt.selected_slot_id),
    displayedQuestion,
    questionMatched: scenario.expectedQuestionIncludes.some((keyword) =>
      displayedQuestion.includes(keyword),
    ),
    candidateSlots,
  };
}

async function main() {
  const results = [];

  for (const scenario of scenarios) {
    results.push(await runScenario(scenario));
  }

  const failures = results.filter(
    (result) => !result.firstCategoryMatched || !result.selectedSlotMatched || !result.questionMatched,
  );

  console.log(JSON.stringify(results, null, 2));

  if (failures.length > 0) {
    throw new Error(
      `Chief complaint smoke failed: ${failures.map((failure) => failure.scenario).join(", ")}`,
    );
  }
}

void main();
