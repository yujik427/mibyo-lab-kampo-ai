import type { CategoryId } from "./types";

export type TurnFeedbackStyle = "classic" | "natural";

interface TurnFeedbackContext {
  selectedCategoryId: CategoryId;
  categoryLabel: string;
  chiefComplaintSummary: string;
  previousAnswerSummary: string;
}

export function getTurnFeedbackStyle(): TurnFeedbackStyle {
  return process.env.NEXT_PUBLIC_KANPO_TURN_FEEDBACK_STYLE === "classic"
    ? "classic"
    : "natural";
}

function rewriteSummaryForEmpathy(summary: string) {
  const trimmed = summary.trim().replace(/[。.!！?？]+$/u, "");
  if (!trimmed) return "";

  return trimmed
    .replace(/は今のところ目立ちません$/u, "は今のところ目立っていないんですね")
    .replace(/はあまり目立ちません$/u, "はあまり目立たないんですね")
    .replace(/はときどきあります$/u, "はときどきあるんですね")
    .replace(/はよくあります$/u, "はよくあるんですね")
    .replace(/はかなり続いています$/u, "はかなり続いているんですね")
    .replace(/があります$/u, "があるのですね")
    .replace(/は特にありません$/u, "は特にないのですね");
}

function buildFeedbackLead(summary: string) {
  const rewritten = rewriteSummaryForEmpathy(summary);
  if (!rewritten) return "";
  return `${rewritten}。`;
}

function getTurnFeedbackInsight(categoryId: CategoryId) {
  switch (categoryId) {
    case "sleep_recovery":
      return "表面の症状が強くなくても、回復力の落ち込みがだるさとして出ることがあるので、次は回復しきれていない負担が続いていないかを見ていきます。";
    case "stress_emotion":
      return "今の不調の背景に緊張やストレスの反応が重なっていることもあるので、次はその影響が体に出やすいかを見ていきます。";
    case "qi_flow":
      return "乾きや重だるさだけでは説明しきれないときは、つかえ感やムカつきとして出ることがあるので、次はその出方を見ていきます。";
    case "blood_state":
      return "今の症状の裏に、血の不足や巡りの影響が重なっていることもあるので、次はそのサインがないかを見ていきます。";
    case "water_balance":
      return "乾きが強くなくても、水分の巡りの偏りが重だるさとして出ることがあるので、次はむくみや重だるさの出方を見ていきます。";
    case "dry_damp_balance":
      return "むくみが目立たなくても、乾きや水分不足が別の形で出ることがあるので、次はその偏りがないかを見ていきます。";
    case "safety_check":
      return "最後に安全面だけ短く確認して、全体のまとめへ進みます。";
    default:
      return "次で少し具体的に確かめてみます。";
  }
}

function sanitizeFeedbackText(text: string) {
  return text
    .replace(/一緒に整理して(?:いきましょう|みましょう)/gu, "少し見ていきます")
    .replace(/関わる点/gu, "ところ")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldUseNaturalFallback(text: string) {
  const trimmed = text.trim();
  return !trimmed;
}

function isMechanicalEcho(text: string, summary: string) {
  const normalizedText = text.trim().replace(/[。.!！?？]+$/u, "");
  const normalizedSummary = summary.trim().replace(/[。.!！?？]+$/u, "");
  if (!normalizedText || !normalizedSummary) return false;

  return (
    normalizedText.startsWith(normalizedSummary) ||
    normalizedText.startsWith(`「${normalizedSummary}」`) ||
    normalizedText.includes(`と感じているのですね`) ||
    normalizedText.includes(`という状態なのですね`)
  );
}

export function buildClassicTurnFeedback(context: TurnFeedbackContext) {
  if (context.previousAnswerSummary.trim()) {
    return `ここまでのお話だと、「${context.previousAnswerSummary.trim()}」という流れも見えてきました。`;
  }

  return `${context.categoryLabel}に関わる点を、もう少しだけ一緒に整理してみましょう。`;
}

export function buildNaturalTurnFeedback(context: TurnFeedbackContext) {
  const summary = context.previousAnswerSummary.trim() || context.chiefComplaintSummary.trim();
  const lead = buildFeedbackLead(summary);
  const insight = getTurnFeedbackInsight(context.selectedCategoryId);
  return `${lead}${insight}`.trim();
}

export function buildDefaultTurnFeedback(context: TurnFeedbackContext) {
  return getTurnFeedbackStyle() === "classic"
    ? buildClassicTurnFeedback(context)
    : buildNaturalTurnFeedback(context);
}

export function normalizeTurnFeedback(
  parsedFeedback: string | undefined,
  context: TurnFeedbackContext,
) {
  const style = getTurnFeedbackStyle();
  const trimmed = typeof parsedFeedback === "string" ? parsedFeedback.trim() : "";

  if (style === "classic") {
    return trimmed || buildClassicTurnFeedback(context);
  }

  const normalized = trimmed ? sanitizeFeedbackText(trimmed) : "";
  return shouldUseNaturalFallback(normalized) ||
    isMechanicalEcho(normalized, context.previousAnswerSummary)
    ? buildNaturalTurnFeedback(context)
    : normalized;
}
