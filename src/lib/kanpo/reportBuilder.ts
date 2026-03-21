import { buildBodyLabels } from "./labelEngine";
import type {
  AnswerItem,
  BodyLabels,
  CandidateFormula,
  FinalReportInput,
  RedFlagSummary,
  ScoreSnapshot,
} from "./types";

function buildStrongAnswerSummary(answers: AnswerItem[]) {
  const strongAnswers = answers
    .filter((answer) => answer.selectedOption >= 2)
    .sort((left, right) => right.selectedOption - left.selectedOption)
    .slice(0, 6);

  if (strongAnswers.length === 0) {
    return "今回の20問では、強く偏った回答は多くありませんでした。";
  }

  return strongAnswers
    .map((answer) => `- ${answer.questionText}: ${answer.selectedLabel}`)
    .join("\n");
}

function buildChiefComplaintSummary(answers: AnswerItem[]) {
  const priorities = answers
    .filter((answer) => answer.selectedOption >= 3)
    .sort((left, right) => right.selectedOption - left.selectedOption)
    .slice(0, 3);

  if (priorities.length === 0) {
    return "今回の回答では、特定の症状だけが突出しているというより、全体傾向の整理が中心です。";
  }

  return priorities.map((answer) => answer.freeTextSummary || answer.questionText).join(" / ");
}

function buildKnowledgeBaseContext(
  snapshot: ScoreSnapshot,
  bodyLabels: BodyLabels,
  redFlags: RedFlagSummary,
) {
  const sortedPatterns = Object.entries(snapshot.mainScores)
    .sort((left, right) => right[1].percent - left[1].percent)
    .slice(0, 3)
    .map(([pattern, detail]) => `${pattern} ${detail.percent.toFixed(1)}点`)
    .join("、");

  return [
    `上位の体質傾向: ${sortedPatterns || "まだ弱い傾向のみ"}`,
    `虚実: ${bodyLabels.kyojitsu}`,
    `寒熱: 上 ${bodyLabels.upperTemperature} / 下 ${bodyLabels.lowerTemperature}`,
    `燥湿: 上 ${bodyLabels.upperTexture} / 下 ${bodyLabels.lowerTexture}`,
    `赤旗: ${redFlags.hasRedFlags ? "あり" : "なし"}`,
  ].join("\n");
}

export function buildFinalReportInput(args: {
  answers: AnswerItem[];
  snapshot: ScoreSnapshot;
  candidateFormulas: CandidateFormula[];
  redFlags: RedFlagSummary;
}): FinalReportInput {
  const bodyLabels = buildBodyLabels(args.snapshot.bodyFigureValues);

  return {
    main_scores: {
      気滞: args.snapshot.mainScores.気滞.percent,
      気逆: args.snapshot.mainScores.気逆.percent,
      気虚: args.snapshot.mainScores.気虚.percent,
      血虚: args.snapshot.mainScores.血虚.percent,
      瘀血: args.snapshot.mainScores.瘀血.percent,
      水滞: args.snapshot.mainScores.水滞.percent,
      津液不足: args.snapshot.mainScores.津液不足.percent,
    },
    sub_scores: {
      dry: args.snapshot.subScores.dry.percent,
      damp: args.snapshot.subScores.damp.percent,
      upper_damp: args.snapshot.subScores.upperDamp.percent,
      lower_damp: args.snapshot.subScores.lowerDamp.percent,
      upper_dry: args.snapshot.subScores.upperDry.percent,
      lower_dry: args.snapshot.subScores.lowerDry.percent,
    },
    body_labels: bodyLabels,
    chief_complaint_summary: buildChiefComplaintSummary(args.answers),
    answer_summary: buildStrongAnswerSummary(args.answers),
    candidate_formulas: args.candidateFormulas,
    knowledge_base_context: buildKnowledgeBaseContext(
      args.snapshot,
      bodyLabels,
      args.redFlags,
    ),
    red_flag_summary: args.redFlags.summary,
  };
}

export function buildFallbackFinalReport(input: FinalReportInput) {
  const formulaText =
    input.candidate_formulas.length > 0
      ? input.candidate_formulas
          .map((formula) => `- ${formula.name}: ${formula.reason}`)
          .join("\n")
      : "- 候補処方は現在整理中です。";

  return [
    "## 今回考えられる体質の傾向",
    `主な傾向は ${Object.entries(input.main_scores)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([label]) => label)
      .join("・")} です。`,
    "",
    "## なぜそう考えたか",
    input.answer_summary,
    "",
    "## 体質ラベルの整理",
    `虚実: ${input.body_labels.kyojitsu}`,
    `寒熱: 上 ${input.body_labels.upperTemperature} / 下 ${input.body_labels.lowerTemperature}`,
    `燥湿: 上 ${input.body_labels.upperTexture} / 下 ${input.body_labels.lowerTexture}`,
    "",
    "## 候補処方の特徴",
    formulaText,
    "",
    "## 注意点",
    input.red_flag_summary,
    "",
    "ここまでで、今回の整理は一度区切ります。",
    "ご利用ありがとうございました。",
    "このチャットは、実際に使ってもらいながら",
    "より役に立つ形に育てていきたいと考えています。",
    "もしよければ、1分ほどで終わるアンケートに",
    "ご協力いただけると嬉しいです（匿名です）。",
    "https://forms.gle/Y7uG1sj3AD6F1BFL9",
  ].join("\n");
}
