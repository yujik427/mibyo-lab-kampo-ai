interface ParsedDiagnosis {
  constitutionType: string;
  summary: string;
  sections: { title: string; content: string }[];
  recommendations: string[];
  kampoSuggestions: string[];
}

export function parseDiagnosisResponse(rawText: string): ParsedDiagnosis {
  const result: ParsedDiagnosis = {
    constitutionType: "",
    summary: "",
    sections: [],
    recommendations: [],
    kampoSuggestions: [],
  };

  if (!rawText) return result;

  const constitutionPatterns = [
    /(?:体質|タイプ|証)[：:]\s*(.+)/,
    /「(.+?)」\s*(?:タイプ|体質|証)/,
    /(.+?(?:虚|実|陰|陽|気滞|血虚|気虚|血瘀|痰湿|陰虚|陽虚))\s*(?:タイプ|体質|傾向)/,
  ];
  for (const pattern of constitutionPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      result.constitutionType = match[1].trim();
      break;
    }
  }

  const sectionHeaders = rawText.match(/(?:^|\n)\s*(?:\d+[\)）.]|#+)\s*.+/g);
  if (sectionHeaders && sectionHeaders.length > 0) {
    const lines = rawText.split("\n");
    let currentTitle = "";
    let currentContent: string[] = [];

    for (const line of lines) {
      const headerMatch = line.match(/^\s*(?:(\d+)[\)）.]|#+)\s*(.+)/);
      if (headerMatch) {
        if (currentTitle && currentContent.length > 0) {
          result.sections.push({
            title: currentTitle,
            content: currentContent.join("\n").trim(),
          });
        }
        currentTitle = (headerMatch[2] || headerMatch[0]).trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    if (currentTitle && currentContent.length > 0) {
      result.sections.push({
        title: currentTitle,
        content: currentContent.join("\n").trim(),
      });
    }
  }

  if (result.sections.length === 0) {
    result.sections.push({
      title: "診断結果",
      content: rawText.trim(),
    });
  }

  if (!result.summary && result.sections.length > 0) {
    const firstContent = result.sections[0].content;
    const firstSentence = firstContent.split(/[。\n]/)[0];
    result.summary = firstSentence.length > 100
      ? firstSentence.slice(0, 100) + "…"
      : firstSentence;
  }

  const kampoPatterns = [
    /(?:補中益気湯|十全大補湯|六君子湯|四君子湯|人参養栄湯|加味逍遙散|当帰芍薬散|桂枝茯苓丸|葛根湯|小青竜湯|麻黄湯|五苓散|半夏厚朴湯|抑肝散|柴胡加竜骨牡蛎湯|温経湯|八味地黄丸|防已黄耆湯|防風通聖散|大柴胡湯|小柴胡湯|柴胡桂枝湯|芍薬甘草湯|麦門冬湯|黄連解毒湯|白虎加人参湯|真武湯|牛車腎気丸|帰脾湯|酸棗仁湯|竹筎温胆湯|清暑益気湯|香蘇散|二陳湯)/g,
  ];
  for (const pattern of kampoPatterns) {
    const matches = rawText.match(pattern);
    if (matches) {
      result.kampoSuggestions = [...new Set(matches)];
      break;
    }
  }

  const recSection = result.sections.find(
    (s) => s.title.includes("生活") || s.title.includes("改善") || s.title.includes("提案") || s.title.includes("アドバイス"),
  );
  if (recSection) {
    const bullets = recSection.content.match(/[・\-\*]\s*(.+)/g);
    if (bullets) {
      result.recommendations = bullets.map((b) => b.replace(/^[・\-\*]\s*/, "").trim());
    }
  }

  return result;
}
