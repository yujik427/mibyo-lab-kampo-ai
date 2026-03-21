import type { CandidateFormula, MainScoreName, MainScores, SubScores } from "./types";

interface FormulaRule extends CandidateFormula {
  targetPatterns: MainScoreName[];
  minimumLevel?: number;
  dryBonus?: number;
  dampBonus?: number;
}

const FORMULA_RULES: readonly FormulaRule[] = [
  {
    id: "hochuekkito",
    name: "補中益気湯",
    reason: "疲れやすさや回復力の低下が前に出るときに検討しやすい処方です。",
    targetPatterns: ["気虚"],
    minimumLevel: 3,
  },
  {
    id: "rikkunshito",
    name: "六君子湯",
    reason: "気虚に加えて胃腸の重さや水はけの悪さが重なるときの候補です。",
    targetPatterns: ["気虚", "水滞"],
    minimumLevel: 3,
    dampBonus: 0.6,
  },
  {
    id: "kamishoyosan",
    name: "加味逍遙散",
    reason: "ストレスの影響で気の巡りが乱れやすいときに候補へ入りやすい処方です。",
    targetPatterns: ["気滞", "血虚"],
    minimumLevel: 3,
  },
  {
    id: "hangekobokuto",
    name: "半夏厚朴湯",
    reason: "つかえ感や気の上逆が目立つときに検討しやすい処方です。",
    targetPatterns: ["気逆", "気滞"],
    minimumLevel: 3,
    dampBonus: 0.4,
  },
  {
    id: "keishibukuryogan",
    name: "桂枝茯苓丸",
    reason: "巡りの滞りや瘀血傾向が前に出るときの代表的な候補です。",
    targetPatterns: ["瘀血"],
    minimumLevel: 3,
  },
  {
    id: "tokishakuyakusan",
    name: "当帰芍薬散",
    reason: "血虚と水滞が重なり、冷えやむくみが気になるときの候補です。",
    targetPatterns: ["血虚", "水滞"],
    minimumLevel: 3,
    dampBonus: 0.3,
  },
  {
    id: "goreisan",
    name: "五苓散",
    reason: "水分の偏りや重だるさが前面に出るときの候補です。",
    targetPatterns: ["水滞"],
    minimumLevel: 3,
    dampBonus: 0.8,
  },
  {
    id: "bakumondoto",
    name: "麦門冬湯",
    reason: "のどや上半身の乾きが目立つときに説明候補へ入れやすい処方です。",
    targetPatterns: ["津液不足"],
    minimumLevel: 3,
    dryBonus: 0.8,
  },
  {
    id: "ninjinyoeito",
    name: "人参養栄湯",
    reason: "気血両面の不足感が重なるときに候補として整理しやすい処方です。",
    targetPatterns: ["気虚", "血虚"],
    minimumLevel: 3,
    dryBonus: 0.3,
  },
];

function getPatternScore(pattern: MainScoreName, mainScores: MainScores) {
  const detail = mainScores[pattern];
  return detail.level + detail.percent / 100;
}

export function buildFormulaPool(mainScores: MainScores, subScores: SubScores): CandidateFormula[] {
  const ranked = FORMULA_RULES.map((rule) => {
    const targetLevels = rule.targetPatterns.map((pattern) => mainScores[pattern].level);
    const highestLevel = Math.max(...targetLevels);
    const baseScore = rule.targetPatterns.reduce(
      (total, pattern) => total + getPatternScore(pattern, mainScores),
      0,
    );
    const bonus =
      (rule.dryBonus ?? 0) * (subScores.dry.level >= 3 ? 1 : 0) +
      (rule.dampBonus ?? 0) * (subScores.damp.level >= 3 ? 1 : 0);

    return {
      rule,
      totalScore: baseScore + bonus,
      highestLevel,
    };
  })
    .filter(({ rule, highestLevel, totalScore }) => {
      const minimumLevel = rule.minimumLevel ?? 2;
      return highestLevel >= minimumLevel && totalScore > 0;
    })
    .sort((left, right) => right.totalScore - left.totalScore)
    .slice(0, 3)
    .map(({ rule }) => ({
      id: rule.id,
      name: rule.name,
      reason: rule.reason,
      targetPatterns: rule.targetPatterns,
    }));

  if (ranked.length > 0) return ranked;

  return [
    {
      id: "supportive-default",
      name: "候補整理中",
      reason: "現段階では強い偏りが大きくないため、体質のまとまりを見ながら候補を絞る前提です。",
      targetPatterns: [],
    },
  ];
}
