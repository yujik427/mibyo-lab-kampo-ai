import type { AnswerItem, RedFlagMatch, RedFlagSummary } from "./types";

interface RedFlagRule {
  id: string;
  label: string;
  reason: string;
  pattern: RegExp;
}

const RED_FLAG_RULES: readonly RedFlagRule[] = [
  {
    id: "severe-pain",
    label: "強い痛み",
    reason: "強い痛み・耐えにくい痛みは、セルフケア優先ではなく受診判断が必要になることがあります。",
    pattern: /(強い痛み|激痛|耐えられない痛み|刺すような痛み)/i,
  },
  {
    id: "sudden-worsening",
    label: "急な悪化",
    reason: "急に悪化した症状は経過観察だけでなく医療機関での確認が必要になることがあります。",
    pattern: /(急に悪化|突然悪化|急にひどく|急激に悪化)/i,
  },
  {
    id: "bleeding",
    label: "出血",
    reason: "出血を伴う訴えは固定ルールで受診候補として扱います。",
    pattern: /(出血|血が混じる|吐血|下血|血尿)/i,
  },
  {
    id: "fever",
    label: "発熱",
    reason: "発熱を伴う場合は、体質相談より先に急性症状の確認が必要です。",
    pattern: /(高熱|発熱|38度|39度)/i,
  },
  {
    id: "breathing",
    label: "呼吸苦",
    reason: "息苦しさや呼吸のしづらさは赤旗として扱います。",
    pattern: /(息苦しい|呼吸が苦しい|呼吸しづらい|胸が苦しい)/i,
  },
  {
    id: "consciousness",
    label: "意識障害",
    reason: "意識がもうろうとする訴えは早めの受診判断が必要です。",
    pattern: /(意識がもうろう|意識が飛ぶ|失神|倒れた)/i,
  },
];

function collectSourceTexts(answers: AnswerItem[], chiefComplaintSummary: string) {
  return [
    chiefComplaintSummary,
    ...answers.flatMap((answer) => [
      answer.rawMessage,
      answer.freeTextSummary,
      answer.redFlagReason,
    ]),
  ]
    .map((text) => text.trim())
    .filter(Boolean);
}

export function evaluateRedFlags(
  answers: AnswerItem[],
  chiefComplaintSummary = "",
): RedFlagSummary {
  const sourceTexts = collectSourceTexts(answers, chiefComplaintSummary);

  const textMatches = RED_FLAG_RULES.filter((rule) =>
    sourceTexts.some((text) => rule.pattern.test(text)),
  ).map<RedFlagMatch>((rule) => ({
    id: rule.id,
    label: rule.label,
    reason: rule.reason,
  }));

  const parserMatches = answers
    .filter((answer) => answer.redFlagHint)
    .map<RedFlagMatch>((answer, index) => ({
      id: `parser-${answer.questionId}-${index}`,
      label: "AI整理で赤旗候補",
      reason: answer.redFlagReason || `${answer.questionId} の自由回答に赤旗候補が含まれました。`,
    }));

  const matchedRules = [...textMatches, ...parserMatches];

  return {
    hasRedFlags: matchedRules.length > 0,
    matchedRules,
    summary:
      matchedRules.length > 0
        ? matchedRules.map((match) => `- ${match.label}: ${match.reason}`).join("\n")
        : "現時点で固定ルールに該当する赤旗症状は検出されていません。",
  };
}
