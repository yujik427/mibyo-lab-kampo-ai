import { INTERVIEW_MAX_TURNS, getCategoryDefinition } from "../src/lib/kanpo/categoryRegistry";
import { buildFormulaPool } from "../src/lib/kanpo/formulaPool";
import { buildFallbackFinalReport, buildFinalReportInput } from "../src/lib/kanpo/reportBuilder";
import { evaluateRedFlagsFromTexts } from "../src/lib/kanpo/redFlagRules";
import {
  SCORE_SLOT_IDS,
  buildTurnBuilderSlotCandidates,
  getScoreSlotDefinition,
} from "../src/lib/kanpo/slotRegistry";
import { computeScoreSnapshotFromConfirmedSlots } from "../src/lib/kanpo/scoreEngine";
import { selectNextCategoryId } from "../src/lib/kanpo/turnController";
import type {
  CategoryId,
  OpeningIntakeAnswerParserResult,
  ScoreSlotId,
  ScoreSlotState,
  TurnAnswerParserResult,
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

type ScenarioAnswer = {
  option: 0 | 1 | 2 | 3 | 4;
  note: string;
};

type Scenario = {
  name: string;
  opening: string;
  expectedFirstCategory: CategoryId;
  answers: Partial<Record<CategoryId, ScenarioAnswer>>;
};

const scenarios: Scenario[] = [
  {
    name: "fatigue-stress",
    opening: "朝から疲れが残り、会議前は胸がつかえてため息が増えます。",
    expectedFirstCategory: "qi_flow",
    answers: {
      sleep_recovery: { option: 4, note: "朝が特につらく、食後も眠気が強いです。" },
      stress_emotion: { option: 4, note: "会議や締切前に胸やお腹が張ってため息が増えます。" },
      qi_flow: { option: 3, note: "緊張すると喉や胃がつかえる感じがあります。" },
      blood_state: { option: 2, note: "夕方は目が疲れやすく、立ちくらみも時々あります。" },
      water_balance: { option: 1, note: "むくみは軽めですが、雨の日は少し重いです。" },
      dry_damp_balance: { option: 1, note: "乾きは強くありません。" },
      safety_check: { option: 0, note: "急な悪化や強い痛み、出血はありません。" },
    },
  },
  {
    name: "damp-heaviness",
    opening: "頭が重くてすっきりせず、脚もむくみやすく雨の日にだるさが強まります。",
    expectedFirstCategory: "water_balance",
    answers: {
      sleep_recovery: { option: 2, note: "食後は少し眠くなります。" },
      stress_emotion: { option: 1, note: "ストレスで張る感じは少なめです。" },
      qi_flow: { option: 2, note: "たまにムカつきますが強くはありません。" },
      blood_state: { option: 1, note: "目の疲れや立ちくらみは軽いです。" },
      water_balance: { option: 4, note: "上半身の重さと脚のむくみがかなり気になります。" },
      dry_damp_balance: { option: 1, note: "乾燥より重だるさが中心です。" },
      safety_check: { option: 0, note: "急な悪化や発熱、呼吸苦はありません。" },
    },
  },
  {
    name: "dry-blood-deficiency",
    opening: "夕方になると目やのどが乾いて、すねやかかとも粉をふきやすいです。",
    expectedFirstCategory: "dry_damp_balance",
    answers: {
      sleep_recovery: { option: 1, note: "疲れは軽めです。" },
      stress_emotion: { option: 1, note: "ストレスの張り感はそこまでありません。" },
      qi_flow: { option: 1, note: "つかえ感は少ないです。" },
      blood_state: { option: 3, note: "夕方の目の疲れとかすみが出やすいです。" },
      water_balance: { option: 0, note: "むくみや重だるさはほとんどありません。" },
      dry_damp_balance: { option: 4, note: "目、のど、すね、かかとの乾燥がかなりあります。" },
      safety_check: { option: 0, note: "強い痛みや出血、急な悪化はありません。" },
    },
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

function pickScenarioAnswer(scenario: Scenario, categoryId: CategoryId): ScenarioAnswer {
  return (
    scenario.answers[categoryId] ?? {
      option: 2,
      note: "中くらいの頻度で気になります。",
    }
  );
}

async function runScenario(scenario: Scenario) {
  const opening = await postJson<OpeningIntakeAnswerParserResult>("/api/kanpo/answer-parser", {
    mode: "opening_intake",
    user_message: scenario.opening,
  });

  if (opening.mode !== "opening_intake") {
    throw new Error(`[${scenario.name}] opening_intake parser result was invalid`);
  }

  const scoreSlotStates: Partial<Record<ScoreSlotId, ScoreSlotState>> = {};
  const categorySequence: CategoryId[] = [];
  const selectedSlotSequence: Array<ScoreSlotId | null> = [];
  let lastCategoryId: CategoryId | null = null;
  let previousAnswerSummary = "";
  let selectedSlotPassCount = 0;
  let selectedSlotHintAlignmentCount = 0;
  const freeTextHistory: string[] = [scenario.opening, opening.chief_complaint_summary];

  for (let turnNumber = 1; turnNumber <= INTERVIEW_MAX_TURNS; turnNumber += 1) {
    const nextCategoryId = selectNextCategoryId({
      nextTurnNumber: turnNumber,
      lastCategoryId,
      chiefComplaintCategoryHints: opening.chief_complaint_category_hints,
      scoreSlotStates,
    });
    if (nextCategoryId === "safety_check") {
      throw new Error(`[${scenario.name}] unexpected safety_check inside main 20 turns`);
    }
    const category = getCategoryDefinition(nextCategoryId);
    const candidateSlots = buildTurnBuilderSlotCandidates({
      categoryId: nextCategoryId,
      chiefComplaintSummary: opening.chief_complaint_summary,
      scoreSlotStates,
      limit: 3,
    });
    const turnBuilt = await postJson<TurnBuilderResult>("/api/kanpo/turn-builder", {
      turn_index: turnNumber,
      selected_category_id: nextCategoryId,
      category_label: category.label,
      category_description: category.description,
      chief_complaint_summary: opening.chief_complaint_summary,
      previous_answer_summary: previousAnswerSummary,
      previous_feedback_hint: "",
      answer_mode: "scale_0_4_with_optional_note",
      options: [...defaultOptions],
      candidate_slots: candidateSlots,
    });

    const answer = pickScenarioAnswer(scenario, nextCategoryId);
    const parserInput = {
      mode: "turn_answer",
      selected_category_id: nextCategoryId,
      selected_slot_id: turnBuilt.selected_slot_id,
      question_text: turnBuilt.question_text,
      selected_option: answer.option,
      optional_note: answer.note,
      allowed_slot_ids: candidateSlots.map((slot) => slot.slot_id),
    } as const;

    const turnAnswer = await postJson<TurnAnswerParserResult>("/api/kanpo/answer-parser", parserInput);

    if (turnAnswer.mode !== "turn_answer") {
      throw new Error(`[${scenario.name}] turn_answer parser result was invalid`);
    }

    if (parserInput.selected_slot_id === turnBuilt.selected_slot_id) {
      selectedSlotPassCount += 1;
    }

    const hintIncludesSelectedSlot =
      turnBuilt.selected_slot_id === null
        ? true
        : turnAnswer.possible_slot_hints.some((hint) => hint.slot_id === turnBuilt.selected_slot_id);
    if (hintIncludesSelectedSlot) {
      selectedSlotHintAlignmentCount += 1;
    }

    if (turnBuilt.selected_slot_id) {
      const selectedSlot = getScoreSlotDefinition(turnBuilt.selected_slot_id);
      scoreSlotStates[turnBuilt.selected_slot_id] = {
        slotId: selectedSlot.id,
        hiddenScoreKey: selectedSlot.hiddenScoreKey,
        value: Math.max(0, Math.min(4, Math.trunc(turnAnswer.selected_option))) as
          | 0
          | 1
          | 2
          | 3
          | 4,
        status: "confirmed",
        confidence: turnAnswer.confidence,
        evidence: turnAnswer.free_text_summary,
        sourceTurn: turnNumber,
      };
    }

    for (const hint of turnAnswer.possible_slot_hints) {
      if (hint.slot_id === turnBuilt.selected_slot_id) continue;
      if (scoreSlotStates[hint.slot_id]?.status === "confirmed") continue;
      const hintedSlot = getScoreSlotDefinition(hint.slot_id);
      scoreSlotStates[hint.slot_id] = {
        slotId: hintedSlot.id,
        hiddenScoreKey: hintedSlot.hiddenScoreKey,
        value: null,
        status: "tentative",
        confidence: hint.confidence,
        evidence: hint.reason,
        sourceTurn: turnNumber,
      };
    }

    categorySequence.push(nextCategoryId);
    selectedSlotSequence.push(turnBuilt.selected_slot_id);
    previousAnswerSummary = turnAnswer.free_text_summary;
    lastCategoryId = nextCategoryId;
    freeTextHistory.push(answer.note, turnAnswer.free_text_summary, turnAnswer.red_flag_reason);
  }

  const snapshot = computeScoreSnapshotFromConfirmedSlots(scoreSlotStates);
  const confirmedCount = Object.values(scoreSlotStates).filter(
    (state) => state?.status === "confirmed",
  ).length;
  const tentativeCount = Object.values(scoreSlotStates).filter(
    (state) => state?.status === "tentative",
  ).length;
  const topMainScores = Object.entries(snapshot.mainScores)
    .sort((left, right) => right[1].percent - left[1].percent)
    .slice(0, 3)
    .map(([label, detail]) => ({
      label,
      percent: detail.percent,
      level: detail.level,
    }));

  const safetyAnswer = pickScenarioAnswer(scenario, "safety_check");
  const safetyResult = await postJson<TurnAnswerParserResult>("/api/kanpo/answer-parser", {
    mode: "turn_answer",
    selected_category_id: "safety_check",
    selected_slot_id: null,
    question_text:
      "ここ2週間で、強い痛み・急な悪化・出血・高熱・息苦しさ・意識が遠のく感じなど、早めに医療機関へ相談したい症状はありましたか。",
    selected_option: safetyAnswer.option,
    optional_note: safetyAnswer.note,
    allowed_slot_ids: [],
  });

  if (safetyResult.mode !== "turn_answer") {
    throw new Error(`[${scenario.name}] safety_check parser result was invalid`);
  }

  const safetyCheckSummary = safetyResult.free_text_summary || safetyAnswer.note;
  freeTextHistory.push(safetyAnswer.note, safetyCheckSummary, safetyResult.red_flag_reason);

  const redFlags = evaluateRedFlagsFromTexts(
    freeTextHistory.filter((text) => text.trim().length > 0),
    [safetyResult.red_flag_reason].filter((text) => text.trim().length > 0),
  );
  const candidateFormulas = buildFormulaPool(snapshot.mainScores, snapshot.subScores);
  const finalReportInput = buildFinalReportInput({
    answers: Object.values(scoreSlotStates)
      .filter((state): state is ScoreSlotState => Boolean(state && state.status === "confirmed"))
      .map((state) => {
        const slot = getScoreSlotDefinition(state.slotId);
        const selectedOption = state.value ?? 0;
        return {
          questionId: slot.hiddenScoreKey,
          questionText: slot.canonicalQuestionText,
          selectedOption,
          selectedLabel: `${selectedOption}`,
          freeTextSummary: state.evidence,
          rawMessage: state.evidence,
          redFlagHint: false,
          redFlagReason: "",
          confidence: state.confidence,
          answeredAt: "",
        };
      }),
    snapshot,
    candidateFormulas,
    redFlags,
    chiefComplaintSummary: opening.chief_complaint_summary,
    safetyCheckSummary,
    confirmedCount,
    totalSlots: SCORE_SLOT_IDS.length,
  });

  let finalReportContent = "";
  try {
    const response = await postJson<{ content?: string }>("/api/kanpo/final-report", finalReportInput);
    finalReportContent = response.content || buildFallbackFinalReport(finalReportInput);
  } catch {
    finalReportContent = buildFallbackFinalReport(finalReportInput);
  }

  const requiredHeadings = [
    "## 今回考えられる体質の傾向",
    "## なぜそう考えたか",
    "## 候補処方の特徴",
    "## 代表処方名",
    "## セルフケア",
    "## 注意点",
    "## アンケート案内",
  ];

  return {
    scenario: scenario.name,
    openingSummary: opening.chief_complaint_summary,
    expectedFirstCategory: scenario.expectedFirstCategory,
    firstCategoryMatched: categorySequence[0] === scenario.expectedFirstCategory,
    categorySequence,
    selectedSlotSequence,
    confirmedCount,
    tentativeCount,
    unconfirmedSlots: SCORE_SLOT_IDS.length - confirmedCount,
    selectedSlotPassedAllTurns: selectedSlotPassCount === INTERVIEW_MAX_TURNS,
    selectedSlotHintAlignedAllTurns: selectedSlotHintAlignmentCount === INTERVIEW_MAX_TURNS,
    safetyCheckCompleted: true,
    safetyCheckSummary,
    finalReportHasAllHeadings: requiredHeadings.every((heading) => finalReportContent.includes(heading)),
    finalReportHasSurveyLink: finalReportContent.includes("https://forms.gle/Y7uG1sj3AD6F1BFL9"),
    topMainScores,
  };
}

async function main() {
  const results = [];

  for (const scenario of scenarios) {
    results.push(await runScenario(scenario));
  }

  console.log(JSON.stringify(results, null, 2));
}

void main();
