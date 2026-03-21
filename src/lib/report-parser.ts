interface ParsedDiagnosis {
  constitutionType: string;
  summary: string;
  sections: { title: string; content: string }[];
  recommendations: { title: string; content: string }[];
  kampoSuggestions: string[];
  consultationGuidance: string;
}

function extractSection(rawText: string, headerPattern: RegExp): string {
  const match = rawText.match(headerPattern);
  if (!match) return "";
  const start = match.index! + match[0].length;
  const nextHeader = rawText.slice(start).match(/\n##\s+/);
  const end = nextHeader ? start + nextHeader.index! : rawText.length;
  return rawText.slice(start, end).trim();
}

export function parseDiagnosisResponse(rawText: string): ParsedDiagnosis {
  const result: ParsedDiagnosis = {
    constitutionType: "",
    summary: "",
    sections: [],
    recommendations: [],
    kampoSuggestions: [],
    consultationGuidance: "",
  };

  if (!rawText) return result;

  // 体質タイプ（## 体質タイプ の次行）
  const typeMatch = rawText.match(/##\s*体質タイプ\s*\n([^\n#]+)/);
  if (typeMatch) {
    result.constitutionType = typeMatch[1].trim();
  }

  // 構造化フォーマット（## 1) ... ## 2) ... ## 3) ...）でパース
  const section1 = extractSection(rawText, /##\s*1\)\s*体質の整理[^\n]*\n/);
  const section2 = extractSection(rawText, /##\s*2\)\s*体質に合う漢方の方向性[^\n]*\n/);
  let section3 = extractSection(rawText, /##\s*3\)\s*生活改善提案[^\n]*\n/);
  let section4 = extractSection(rawText, /##\s*4\)\s*受診の目安[^\n]*\n/);
  if (!section3) {
    section3 = extractSection(rawText, /3\)\s*生活改善提案[^\n]*\n/);
  }
  if (!section4) {
    section4 = extractSection(rawText, /4\)\s*受診の目安[^\n]*\n/);
  }

  if (section1) {
    result.sections.push({ title: "体質の整理", content: section1 });
  }
  if (section2) {
    result.sections.push({ title: "体質に合う漢方の方向性", content: section2 });
  }
  if (section4) {
    result.consultationGuidance = section4;
  }

  // 生活改善提案：① 見出し：説明 形式をパース
  if (section3) {
    const lines = section3.split("\n");
    const parsed: { title: string; content: string }[] = [];
    let current: { title: string; content: string } | null = null;

    for (const line of lines) {
      const startMatch = line.match(/^[①②③123][\.．、]?\s*([^：:\n]+)[：:]\s*(.*)/);
      if (startMatch) {
        if (current) parsed.push(current);
        current = {
          title: (startMatch[1] || "").trim(),
          content: (startMatch[2] || "").trim(),
        };
      } else if (current && line.trim()) {
        current.content += " " + line.trim();
      }
    }
    if (current) parsed.push(current);
    if (parsed.length > 0) {
      result.recommendations = parsed;
    } else {
      const bullets = section3.match(/[・\-\*]\s*(.+)/g);
      if (bullets) {
        result.recommendations = bullets.map((b) => ({
          title: "",
          content: b.replace(/^[・\-\*]\s*/, "").trim(),
        }));
      }
    }
  }

  // 従来フォーマットのフォールバック（構造化されていない場合）
  if (result.constitutionType === "") {
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
  }

  if (result.sections.length === 0) {
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
  }

  if (result.sections.length === 0) {
    result.sections.push({
      title: "診断結果",
      content: rawText.trim(),
    });
  }

  if (result.recommendations.length === 0) {
    const recSection = result.sections.find(
      (s) =>
        s.title.includes("生活") ||
        s.title.includes("改善") ||
        s.title.includes("提案") ||
        s.title.includes("アドバイス"),
    );
    if (recSection) {
      const bullets = recSection.content.match(/[・\-\*]\s*(.+)/g);
      if (bullets) {
        result.recommendations = bullets.map((b) => ({
          title: "",
          content: b.replace(/^[・\-\*]\s*/, "").trim(),
        }));
      }
    }
  }

  // 生テキスト全体から ① ② ③ または 1. 2. 3. 形式を検索（フォールバック）
  if (result.recommendations.length === 0) {
    const lines = rawText.split("\n");
    const parsed: { title: string; content: string }[] = [];
    for (const line of lines) {
      const withColon = line.match(/^[①②③123][\.．、]?\s*([^：:\n]*)[：:]\s*(.*)/);
      if (withColon) {
        parsed.push({
          title: (withColon[1] || "").trim(),
          content: (withColon[2] || "").trim(),
        });
      } else {
        const withDot = line.match(/^[①②③123][\.．、]\s+(.+)/);
        if (withDot) {
          parsed.push({ title: "", content: (withDot[1] || "").trim() });
        }
      }
    }
    if (parsed.length >= 2) {
      result.recommendations = parsed;
    }
  }

  // 最終フォールバック：生活改善関連の後に出る ・ - * 箇条書き
  if (result.recommendations.length === 0) {
    const lifeIdx = rawText.search(/生活|改善|提案|アドバイス/);
    if (lifeIdx >= 0) {
      const afterLife = rawText.slice(lifeIdx);
      const bullets = afterLife.match(/[・\-\*]\s*(.+)/g);
      if (bullets && bullets.length >= 2) {
        result.recommendations = bullets.slice(0, 6).map((b) => ({
          title: "",
          content: b.replace(/^[・\-\*]\s*/, "").trim(),
        }));
      }
    }
  }

  if (!result.consultationGuidance) {
    const guidanceLines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 &&
          /(受診|医療機関|婦人科|内科|早めに相談|確認が安心|セルフケアを優先)/.test(line),
      );
    if (guidanceLines.length > 0) {
      result.consultationGuidance = guidanceLines[guidanceLines.length - 1];
    }
  }

  if (!result.summary && result.sections.length > 0) {
    const firstContent = result.sections[0].content;
    const firstSentence = firstContent.split(/[。\n]/)[0];
    result.summary =
      firstSentence.length > 100
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

  return result;
}
