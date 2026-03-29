import { buildBodyLabels } from "./labelEngine";
import type {
  AnswerItem,
  BodyLabels,
  CandidateFormula,
  FinalReportInput,
  MainScoreName,
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

function buildRepresentativeFormulaNames(candidateFormulas: CandidateFormula[]) {
  if (candidateFormulas.length === 0) {
    return "- 今回は候補を絞り切らず、体質のまとまりをみながら整理する前提です。";
  }

  return candidateFormulas.map((formula) => `- ${formula.name}`).join("\n");
}

function buildFormulaFeatureSummary(candidateFormulas: CandidateFormula[]) {
  if (candidateFormulas.length === 0) {
    return "- 候補処方は現在整理中です。";
  }

  return candidateFormulas
    .map((formula) => `- ${formula.name}: ${formula.reason}`)
    .join("\n");
}

function buildSelfCareSuggestions(
  mainScores: ScoreSnapshot["mainScores"],
  bodyLabels: BodyLabels,
) {
  const topPatterns = Object.entries(mainScores)
    .sort((left, right) => right[1].percent - left[1].percent)
    .slice(0, 3)
    .map(([pattern]) => pattern as MainScoreName);

  const suggestions = new Set<string>();

  for (const pattern of topPatterns) {
    switch (pattern) {
      case "気虚":
        suggestions.add("休む時間を先に予定へ入れ、食後すぐの無理な活動を詰め込みすぎないようにします。");
        suggestions.add("朝食や昼食を抜きすぎず、消化しやすい温かい食事で回復力を支えます。");
        break;
      case "気滞":
        suggestions.add("長時間張りつめる場面が続く日は、深呼吸や軽い散歩でこわばりを一度ほどきます。");
        break;
      case "気逆":
        suggestions.add("早食いを避け、食後すぐ横にならず、温かい飲み物で胃のつかえ感を和らげます。");
        break;
      case "血虚":
        suggestions.add("夜更かしを減らし、目を酷使する時間が長い日は休憩をこまめに挟みます。");
        break;
      case "瘀血":
        suggestions.add("同じ姿勢が長く続く日は、肩・首・腰まわりを軽く動かして巡りを滞らせすぎないようにします。");
        break;
      case "水滞":
        suggestions.add("冷たい飲み物をだらだら続けず、体を冷やしすぎない範囲で水分の取り方を整えます。");
        suggestions.add("雨の日や座りっぱなしの日は、足首やふくらはぎを軽く動かして重だるさをため込みにくくします。");
        break;
      case "津液不足":
        suggestions.add("のどや肌の乾きが気になる時期は、こまめな水分補給と乾燥対策を意識します。");
        break;
      default:
        break;
    }
  }

  if (bodyLabels.upperTemperature.includes("冷え") || bodyLabels.lowerTemperature.includes("冷え")) {
    suggestions.add("冷えを感じやすい日は、首・お腹・足首を冷やしっぱなしにしないようにします。");
  }

  if (bodyLabels.upperTexture.includes("乾") || bodyLabels.lowerTexture.includes("乾")) {
    suggestions.add("乾燥が気になる日は、空調の当たりすぎや刺激物の取りすぎにも少し注意してみてください。");
  }

  if (bodyLabels.upperTexture.includes("水分") || bodyLabels.lowerTexture.includes("水分")) {
    suggestions.add("むくみや重だるさが出る日は、塩分や夜遅い食事の偏りにも目を向けてみると整理しやすいです。");
  }

  return [...suggestions].slice(0, 4).map((item) => `- ${item}`).join("\n");
}

function buildKnowledgeBaseContext(
  snapshot: ScoreSnapshot,
  bodyLabels: BodyLabels,
  redFlags: RedFlagSummary,
  confirmedCount: number,
  totalSlots: number,
  safetyCheckSummary: string,
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
    `confirmed slot: ${confirmedCount}/${totalSlots}`,
    `安全確認: ${safetyCheckSummary || "未実施"}`,
    `赤旗: ${redFlags.hasRedFlags ? "あり" : "なし"}`,
  ].join("\n");
}

export function buildFinalReportInput(args: {
  answers: AnswerItem[];
  snapshot: ScoreSnapshot;
  candidateFormulas: CandidateFormula[];
  redFlags: RedFlagSummary;
  chiefComplaintSummary: string;
  safetyCheckSummary: string;
  confirmedCount: number;
  totalSlots: number;
}): FinalReportInput {
  const bodyLabels = buildBodyLabels(args.snapshot.bodyFigureValues);
  const chiefComplaintSummary =
    args.chiefComplaintSummary.trim() || buildChiefComplaintSummary(args.answers);

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
    chief_complaint_summary: chiefComplaintSummary,
    answer_summary: buildStrongAnswerSummary(args.answers),
    candidate_formulas: args.candidateFormulas,
    knowledge_base_context: buildKnowledgeBaseContext(
      args.snapshot,
      bodyLabels,
      args.redFlags,
      args.confirmedCount,
      args.totalSlots,
      args.safetyCheckSummary,
    ),
    red_flag_summary: args.redFlags.summary,
    safety_check_summary: args.safetyCheckSummary,
    confirmed_count: args.confirmedCount,
    total_slots: args.totalSlots,
  };
}

export function buildFallbackFinalReport(input: FinalReportInput) {
  const topPatterns = Object.entries(input.main_scores)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([label]) => label)
    .join("・");
  const selfCareText = buildSelfCareSuggestions(
    {
      気滞: { raw: 0, max: 0, percent: input.main_scores.気滞, level: 0 },
      気逆: { raw: 0, max: 0, percent: input.main_scores.気逆, level: 0 },
      気虚: { raw: 0, max: 0, percent: input.main_scores.気虚, level: 0 },
      血虚: { raw: 0, max: 0, percent: input.main_scores.血虚, level: 0 },
      瘀血: { raw: 0, max: 0, percent: input.main_scores.瘀血, level: 0 },
      水滞: { raw: 0, max: 0, percent: input.main_scores.水滞, level: 0 },
      津液不足: { raw: 0, max: 0, percent: input.main_scores.津液不足, level: 0 },
    },
    input.body_labels,
  );

  return [
    "## 今回考えられる体質の傾向",
    `主な傾向は ${topPatterns || "大きな偏りはまだ限定的"} です。`,
    input.confirmed_count < input.total_slots
      ? `今回は confirmed slot ${input.confirmed_count}/${input.total_slots} をもとに整理しています。`
      : "20ターンの体質整理をもとに全体像をまとめています。",
    "",
    "## なぜそう考えたか",
    input.chief_complaint_summary,
    "",
    input.answer_summary,
    "",
    "## 候補処方の特徴",
    buildFormulaFeatureSummary(input.candidate_formulas),
    "",
    "## 代表処方名",
    buildRepresentativeFormulaNames(input.candidate_formulas),
    "",
    "## セルフケア",
    selfCareText || "- 生活リズム、食事、睡眠、冷えや乾燥対策を無理のない範囲で整えてみてください。",
    "",
    "## 注意点",
    `虚実: ${input.body_labels.kyojitsu}`,
    `寒熱: 上 ${input.body_labels.upperTemperature} / 下 ${input.body_labels.lowerTemperature}`,
    `燥湿: 上 ${input.body_labels.upperTexture} / 下 ${input.body_labels.lowerTexture}`,
    input.safety_check_summary ? `安全確認メモ: ${input.safety_check_summary}` : "",
    input.red_flag_summary,
    "",
    "ここまでで、今回の整理は一度区切ります。",
    "ご利用ありがとうございました。",
    "## アンケート案内",
    "このチャットは、実際に使ってもらいながら",
    "より役に立つ形に育てていきたいと考えています。",
    "もしよければ、1分ほどで終わるアンケートに",
    "ご協力いただけると嬉しいです（匿名です）。",
    "https://forms.gle/Y7uG1sj3AD6F1BFL9",
  ].join("\n");
}
