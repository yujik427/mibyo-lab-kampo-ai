"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Leaf, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConstitutionAvatar } from "@/components/ConstitutionAvatar";
import { getReportById } from "@/lib/storage";
import type { DiagnosisReport } from "@/lib/types";
import {
  answersToConstitutionAvatarScores,
  avatarScoresToDisplayState,
  scoreToBodyVariant,
  scoreToTemperatureColor,
  scoreToTemperatureOpacity,
  scoreToTextureBackgroundStyle,
  TEMPERATURE_COLORS,
  TEXTURE_COLORS,
} from "@/lib/constitution/visual";
import { ConstitutionChart } from "@/components/report/constitution-chart";
import { parseDiagnosisResponse } from "@/lib/report-parser";
import { useIsClient } from "@/hooks/use-is-client";

function formatInlineRichText(text: string) {
  return text
    .trim()
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-medium">$1</strong>')
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\*/g, "");
}

function formatInlineRichTextWithLinks(text: string) {
  return formatInlineRichText(text).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer" class="text-primary underline underline-offset-2">$1</a>',
  );
}

function RichContent({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-sm text-muted-foreground leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        const bulletMatch = trimmed.match(/^[・\-\*]\s*(.+)/);
        if (bulletMatch) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
              <span>{bulletMatch[1]}</span>
            </div>
          );
        }

        const boldText = formatInlineRichText(trimmed);
        if (boldText !== trimmed) {
          return <p key={i} dangerouslySetInnerHTML={{ __html: boldText }} />;
        }

        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}

function DirectionContent({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[・\-\*]\s*/, "").trim());

  const items: { body: string; example?: string }[] = [];

  for (const line of lines) {
    if (/^代表処方例[：:]/.test(line)) {
      if (items.length === 0) {
        items.push({ body: "" });
      }
      items[items.length - 1].example = line.replace(/^代表処方例[：:]\s*/, "").trim();
      continue;
    }

    items.push({ body: line });
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={idx} className="space-y-2">
          {item.body ? (
            <p
              className="text-sm leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: formatInlineRichText(item.body) }}
            />
          ) : null}
          {item.example ? (
            <div className="ml-4 border-l border-border pl-3">
              <p className="text-xs font-medium text-muted-foreground">代表処方例</p>
              <p
                className="mt-1 text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: formatInlineRichText(item.example) }}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type OrderedAnalysisItem = {
  marker: string;
  body: string;
};

function FormattedAnalysisContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let bulletItems: string[] = [];
  let orderedItems: OrderedAnalysisItem[] = [];

  const flushBullets = () => {
    if (bulletItems.length === 0) return;
    blocks.push(
      <ul key={`bullets-${blocks.length}`} className="space-y-1.5 pl-1 text-sm leading-relaxed text-foreground/90">
        {bulletItems.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/45" />
            <span dangerouslySetInnerHTML={{ __html: formatInlineRichTextWithLinks(item) }} />
          </li>
        ))}
      </ul>,
    );
    bulletItems = [];
  };

  const flushOrdered = () => {
    if (orderedItems.length === 0) return;
    blocks.push(
      <ol key={`ordered-${blocks.length}`} className="space-y-2 text-sm leading-relaxed text-foreground/90">
        {orderedItems.map((item, idx) => (
          <li key={`${item.marker}-${idx}`} className="flex items-start gap-2.5">
            <span className="w-4 shrink-0 pt-0.5 text-[11px] font-semibold text-muted-foreground">
              {idx + 1}.
            </span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineRichTextWithLinks(item.body) }} />
          </li>
        ))}
      </ol>,
    );
    orderedItems = [];
  };

  const flushLists = () => {
    flushBullets();
    flushOrdered();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      flushLists();
      blocks.push(<div key={`space-${i}`} className="h-2" />);
      continue;
    }

    if (/^[-—–]{3,}$/.test(trimmed)) {
      flushLists();
      blocks.push(<div key={`divider-${i}`} className="my-1 border-t border-border/40" />);
      continue;
    }

    const headingMatch = trimmed.match(/^#{1,6}\s*(.+)$/);
    if (headingMatch) {
      flushLists();
      blocks.push(
        <h3 key={`heading-${i}`} className="pt-1 text-sm font-semibold tracking-tight text-foreground">
          {headingMatch[1].trim()}
        </h3>,
      );
      continue;
    }

    const boldLineMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
    if (boldLineMatch) {
      flushLists();
      blocks.push(
        <p
          key={`bold-${i}`}
          className="text-sm font-semibold leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: formatInlineRichTextWithLinks(boldLineMatch[1].trim()) }}
        />,
      );
      continue;
    }

    const bulletMatch = trimmed.match(/^[・\-*]\s*(.+)$/);
    if (bulletMatch) {
      flushOrdered();
      bulletItems.push(bulletMatch[1].trim());
      continue;
    }

    const orderedMatch = trimmed.match(/^([0-9]+[\.．、)]|[①②③④⑤⑥⑦⑧⑨⑩])\s*(.+)$/);
    if (orderedMatch) {
      flushBullets();
      orderedItems.push({ marker: orderedMatch[1], body: orderedMatch[2].trim() });
      continue;
    }

    flushLists();
    blocks.push(
      <p
        key={`paragraph-${i}`}
        className="text-sm leading-relaxed text-foreground/90"
        dangerouslySetInnerHTML={{ __html: formatInlineRichTextWithLinks(trimmed) }}
      />,
    );
  }

  flushLists();

  return <div className="space-y-2.5">{blocks}</div>;
}

const AVATAR_PREVIEW_CASES = [
  {
    id: "slim",
    label: "細め",
    values: { kyojitsu: -4, upperTemp: -3, lowerTemp: -1, soshitsu: -3 },
  },
  {
    id: "standard",
    label: "標準",
    values: { kyojitsu: 0, upperTemp: 0, lowerTemp: 0, soshitsu: 0 },
  },
  {
    id: "solid",
    label: "しっかりめ",
    values: { kyojitsu: 4, upperTemp: 2, lowerTemp: 4, soshitsu: 3 },
  },
] as const;

const TEMPERATURE_PREVIEW_CASES = [
  {
    id: "heat-4",
    label: "熱 +4",
    caption: "opacity 0.58",
    values: { kyojitsu: 0, upperTemp: 4, lowerTemp: 4, soshitsu: 0 },
  },
  {
    id: "cold-4",
    label: "寒 -4",
    caption: "opacity 0.58",
    values: { kyojitsu: 0, upperTemp: -4, lowerTemp: -4, soshitsu: 0 },
  },
] as const;

const TEMPERATURE_SCALE_PREVIEW_CASES = [
  {
    id: "heat-1",
    label: "熱 +1",
    caption: "opacity 0.20",
    values: { kyojitsu: 0, upperTemp: 1, lowerTemp: 1, soshitsu: 0 },
  },
  {
    id: "heat-2",
    label: "熱 +2",
    caption: "opacity 0.32",
    values: { kyojitsu: 0, upperTemp: 2, lowerTemp: 2, soshitsu: 0 },
  },
  {
    id: "heat-3",
    label: "熱 +3",
    caption: "opacity 0.45",
    values: { kyojitsu: 0, upperTemp: 3, lowerTemp: 3, soshitsu: 0 },
  },
  {
    id: "heat-4-scale",
    label: "熱 +4",
    caption: "opacity 0.58",
    values: { kyojitsu: 0, upperTemp: 4, lowerTemp: 4, soshitsu: 0 },
  },
] as const;

const TEXTURE_SCALE_PREVIEW_CASES = [
  {
    id: "damp-1",
    label: "湿 +1",
    caption: "opacity 0.26",
    values: { kyojitsu: 0, upperTemp: 0, lowerTemp: 0, soshitsu: 1 },
  },
  {
    id: "damp-2",
    label: "湿 +2",
    caption: "opacity 0.38",
    values: { kyojitsu: 0, upperTemp: 0, lowerTemp: 0, soshitsu: 2 },
  },
  {
    id: "damp-3",
    label: "湿 +3",
    caption: "opacity 0.50",
    values: { kyojitsu: 0, upperTemp: 0, lowerTemp: 0, soshitsu: 3 },
  },
  {
    id: "damp-4",
    label: "湿 +4",
    caption: "opacity 0.62",
    values: { kyojitsu: 0, upperTemp: 0, lowerTemp: 0, soshitsu: 4 },
  },
] as const;

const SHOW_AVATAR_PREVIEW = process.env.NEXT_PUBLIC_SHOW_AVATAR_PREVIEW === "true";
const TEMPERATURE_SCALE_SCORES = [4, 3, 2, 1, 0, -1, -2, -3, -4] as const;
const TEXTURE_SCALE_SCORES = [4, 3, 2, 1, 0, -1, -2, -3, -4] as const;
const FREE_ANALYSIS_PLACEHOLDER_SUMMARY = {
  kyojitsu: "算出予定",
  upperTemperature: "算出予定",
  lowerTemperature: "算出予定",
  upperTexture: "算出予定",
  lowerTexture: "算出予定",
} as const;

const FREE_ANALYSIS_PLACEHOLDER_VISUAL = {
  kyojitsu: 0,
  upperTemp: 0,
  lowerTemp: 0,
  soshitsu: 0,
  upperTextureScore: 0,
  lowerTextureScore: 0,
} as const;

function roundDisplayScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(-4, Math.min(4, Math.round(score)));
}

function describeKyojitsuSummary(score: number) {
  const bodyVariant = scoreToBodyVariant(score);
  if (bodyVariant === "slim") return "虚寄り";
  if (bodyVariant === "solid") return "実寄り";
  return "中間";
}

function describeTemperatureSummary(score: number) {
  const roundedScore = roundDisplayScore(score);

  if (roundedScore <= -4) return "強く冷えている";
  if (roundedScore === -3) return "冷えている";
  if (roundedScore <= -1) return "やや冷えている";
  if (roundedScore === 0) return "中間";
  if (roundedScore <= 2) return "やや熱がこもっている";
  if (roundedScore === 3) return "熱がこもっている";
  return "強く熱がこもっている";
}

function describeTextureSummary(score: number) {
  const roundedScore = roundDisplayScore(score);

  if (roundedScore <= -4) return "強く乾燥している";
  if (roundedScore === -3) return "乾燥している";
  if (roundedScore <= -1) return "やや乾燥している";
  if (roundedScore === 0) return "中間";
  if (roundedScore <= 2) return "やや水分がたまっている";
  if (roundedScore === 3) return "水分がたまっている";
  return "強く水分がたまっている";
}

function TemperatureScale() {
  return (
    <div className="w-full max-w-[176px] space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium tracking-[0.06em] text-muted-foreground">
          寒熱スケール
        </p>
        <div className="flex items-center gap-2 text-[10px] font-medium leading-none">
          <span style={{ color: TEMPERATURE_COLORS.heat }}>熱</span>
          <span className="text-muted-foreground/40">/</span>
          <span style={{ color: TEMPERATURE_COLORS.cold }}>寒</span>
        </div>
      </div>
      <div className="grid grid-cols-9 gap-1">
        {TEMPERATURE_SCALE_SCORES.map((score) => {
          const backgroundColor = scoreToTemperatureColor(score);
          const opacity = scoreToTemperatureOpacity(score);

          return (
            <div key={score} className="flex min-w-0 flex-col items-center gap-1">
              <div
                className="h-2.5 w-full rounded-full border border-border/30 sm:h-3"
                style={{
                  backgroundColor: score === 0 ? "#ffffff" : backgroundColor,
                  opacity: score === 0 ? 1 : opacity,
                }}
              />
              <span className="text-[8px] leading-none text-muted-foreground/80">
                {Math.abs(score)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextureScale() {
  return (
    <div className="w-full max-w-[176px] space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium tracking-[0.06em] text-muted-foreground">
          燥湿スケール
        </p>
        <div className="flex items-center gap-2 text-[10px] font-medium leading-none">
          <span style={{ color: TEXTURE_COLORS.damp }}>湿</span>
          <span className="text-muted-foreground/40">/</span>
          <span style={{ color: TEXTURE_COLORS.dry }}>燥</span>
        </div>
      </div>
      <div className="grid grid-cols-9 gap-1">
        {TEXTURE_SCALE_SCORES.map((score) => {
          const textureStyle = scoreToTextureBackgroundStyle(score);

          return (
            <div key={score} className="flex min-w-0 flex-col items-center gap-1">
              <div
                className="h-2.5 w-full rounded-full border border-border/30 bg-white sm:h-3"
                style={{
                  ...textureStyle,
                }}
              />
              <span className="text-[8px] leading-none text-muted-foreground/80">
                {Math.abs(score)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isClient = useIsClient();
  const [showRaw, setShowRaw] = useState(false);
  const report = useMemo<DiagnosisReport | null>(
    () => (isClient ? getReportById(params.id as string) : null),
    [isClient, params.id],
  );

  if (!isClient) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-4">
        <p className="text-lg font-semibold text-foreground">レポートが見つかりません</p>
        <Button className="mt-4" onClick={() => router.push("/report")}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  const date = new Date(report.createdAt);
  const formatted = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const reparsed = parseDiagnosisResponse(report.rawResponse);
  const parsed = {
    constitutionType: report.parsed.constitutionType || reparsed.constitutionType,
    summary: report.parsed.summary || reparsed.summary,
    sections:
      reparsed.sections.length > 0 && reparsed.sections[0]?.title !== "診断結果"
        ? reparsed.sections
        : report.parsed.sections,
    recommendations:
      reparsed.recommendations.length > 0
        ? reparsed.recommendations
        : report.parsed.recommendations,
    kampoSuggestions:
      reparsed.kampoSuggestions.length > 0
        ? reparsed.kampoSuggestions
        : report.parsed.kampoSuggestions,
    consultationGuidance:
      reparsed.consultationGuidance || report.parsed.consultationGuidance || "",
  };
  const avatarScores =
    report.mode === "diagnosis" ? answersToConstitutionAvatarScores(report.answers) : null;
  const avatarDisplayState = avatarScores ? avatarScoresToDisplayState(avatarScores) : null;
  const isFreeAnalysisReport = report.mode === "free";
  const avatarSummary = avatarDisplayState
    ? {
        kyojitsu: describeKyojitsuSummary(avatarDisplayState.kyojitsu),
        upperTemperature: describeTemperatureSummary(avatarDisplayState.upperTemp),
        lowerTemperature: describeTemperatureSummary(avatarDisplayState.lowerTemp),
        upperTexture: describeTextureSummary(avatarDisplayState.upperTextureScore),
        lowerTexture: describeTextureSummary(avatarDisplayState.lowerTextureScore),
      }
    : null;
  return (
    <div className="h-full overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3">
        <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.push("/report")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-sm font-semibold text-foreground">診断レポート</h1>
      </header>

      <div className="mx-auto max-w-[1080px] space-y-4 px-4 py-6 lg:px-6">
        {isFreeAnalysisReport ? (
          <Card
            className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: "20ms", animationFillMode: "both" }}
          >
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-base">体質イメージ</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-3">
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-x-3 xl:grid-cols-[168px_minmax(0,1fr)_minmax(0,1fr)] xl:gap-x-4">
                <section className="space-y-5 lg:pt-1">
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
                      結果要約
                    </p>
                    <div className="mt-3 space-y-3.5">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground">虚実</p>
                        <p className="mt-1 text-[13px] font-medium leading-tight text-foreground">
                          {FREE_ANALYSIS_PLACEHOLDER_SUMMARY.kyojitsu}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground">寒熱</p>
                          <div className="mt-1 space-y-0.5 text-[13px] font-medium leading-tight text-foreground">
                            <p>上: {FREE_ANALYSIS_PLACEHOLDER_SUMMARY.upperTemperature}</p>
                            <p>下: {FREE_ANALYSIS_PLACEHOLDER_SUMMARY.lowerTemperature}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground">燥湿</p>
                          <div className="mt-1 space-y-0.5 text-[13px] font-medium leading-tight text-foreground">
                            <p>上: {FREE_ANALYSIS_PLACEHOLDER_SUMMARY.upperTexture}</p>
                            <p>下: {FREE_ANALYSIS_PLACEHOLDER_SUMMARY.lowerTexture}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <TemperatureScale />
                    <TextureScale />
                  </div>
                </section>

                <section className="space-y-2.5 lg:space-y-3">
                  <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
                    体型図
                  </p>
                  <div className="flex min-h-[205px] items-center justify-center lg:min-h-[236px]">
                    <div className="relative flex w-full max-w-[248px] items-center justify-center lg:max-w-[258px]">
                      <div className="absolute inset-x-6 top-6 bottom-3 rounded-full bg-primary/[0.04] blur-3xl" />
                      <div className="relative w-full max-w-[212px] opacity-45 sm:max-w-[220px] lg:max-w-[228px]">
                        <ConstitutionAvatar
                          kyojitsu={FREE_ANALYSIS_PLACEHOLDER_VISUAL.kyojitsu}
                          upperTemp={FREE_ANALYSIS_PLACEHOLDER_VISUAL.upperTemp}
                          lowerTemp={FREE_ANALYSIS_PLACEHOLDER_VISUAL.lowerTemp}
                          soshitsu={FREE_ANALYSIS_PLACEHOLDER_VISUAL.soshitsu}
                          upperTextureScore={FREE_ANALYSIS_PLACEHOLDER_VISUAL.upperTextureScore}
                          lowerTextureScore={FREE_ANALYSIS_PLACEHOLDER_VISUAL.lowerTextureScore}
                          size={236}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-2.5 lg:space-y-3">
                  <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
                    気血水パラメータ
                  </p>
                  <div className="mx-auto w-full max-w-[220px] lg:max-w-[228px] opacity-70">
                    <ConstitutionChart embedded placeholder />
                  </div>
                </section>
              </div>

              <p className="mx-auto mt-5 max-w-2xl text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                AIが算出した虚実・寒熱・燥湿・気血水スコアを、ここへ反映する予定です。
              </p>
            </CardContent>
          </Card>
        ) : null}

        {isFreeAnalysisReport ? (
          <Card
            className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: "40ms", animationFillMode: "both" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">分析結果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  体質分析
                </Badge>
                <span className="text-xs text-muted-foreground">{formatted}</span>
              </div>
              <FormattedAnalysisContent text={report.rawResponse} />
            </CardContent>
          </Card>
        ) : (
          <Card className="mx-auto max-w-3xl border-2 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CardHeader className="pb-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl text-center text-foreground">
                体質タイプ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-lg font-semibold text-foreground">
                {parsed.constitutionType || "体質診断結果"}
              </p>
              {parsed.summary && (
                <p className="mt-2 text-center text-sm text-muted-foreground leading-relaxed">
                  {parsed.summary}
                </p>
              )}
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  20問診断
                </Badge>
                <span className="text-xs text-muted-foreground">{formatted}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!isFreeAnalysisReport && avatarScores ? (
          <Card
            className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: "40ms", animationFillMode: "both" }}
          >
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-base">体質イメージ</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-3">
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-x-3 xl:grid-cols-[168px_minmax(0,1fr)_minmax(0,1fr)] xl:gap-x-4">
                {avatarSummary ? (
                  <section className="space-y-5 lg:pt-1">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
                        結果要約
                      </p>
                      <div className="mt-3 space-y-3.5">
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground">虚実</p>
                          <p className="mt-1 text-[13px] font-medium leading-tight text-foreground">
                            {avatarSummary.kyojitsu}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground">寒熱</p>
                            <div className="mt-1 space-y-0.5 text-[13px] font-medium leading-tight text-foreground">
                              <p>上: {avatarSummary.upperTemperature}</p>
                              <p>下: {avatarSummary.lowerTemperature}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground">燥湿</p>
                            <div className="mt-1 space-y-0.5 text-[13px] font-medium leading-tight text-foreground">
                              <p>上: {avatarSummary.upperTexture}</p>
                              <p>下: {avatarSummary.lowerTexture}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <TemperatureScale />
                      <TextureScale />
                    </div>
                  </section>
                ) : null}

                <section className="space-y-2.5 lg:space-y-3">
                  <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
                    体型図
                  </p>
                  <div className="flex min-h-[205px] items-center justify-center lg:min-h-[236px]">
                    <div className="relative flex w-full max-w-[248px] items-center justify-center lg:max-w-[258px]">
                      <div className="absolute inset-x-6 top-6 bottom-3 rounded-full bg-primary/[0.04] blur-3xl" />
                      <div className="relative w-full max-w-[212px] sm:max-w-[220px] lg:max-w-[228px]">
                        <ConstitutionAvatar
                          kyojitsu={avatarDisplayState?.kyojitsu ?? avatarScores.kyojitsu}
                          upperTemp={avatarDisplayState?.upperTemp ?? avatarScores.upperTemp}
                          lowerTemp={avatarDisplayState?.lowerTemp ?? avatarScores.lowerTemp}
                          soshitsu={avatarDisplayState?.soshitsu ?? avatarScores.soshitsu}
                          upperTextureScore={avatarDisplayState?.upperTextureScore}
                          lowerTextureScore={avatarDisplayState?.lowerTextureScore}
                          size={236}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {report.answers && Object.keys(report.answers).length > 0 ? (
                  <section className="space-y-2.5 lg:space-y-3">
                    <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
                      気血水パラメータ
                    </p>
                    <div className="mx-auto w-full max-w-[220px] lg:max-w-[228px]">
                      <ConstitutionChart answers={report.answers} embedded />
                    </div>
                  </section>
                ) : null}
              </div>

              <p className="mx-auto mt-5 max-w-2xl text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                体型は細め・標準・しっかりめの3段階で表示し、違いの中心は上下の色と燥湿の質感で表現しています。
              </p>

              {SHOW_AVATAR_PREVIEW ? (
                <div className="space-y-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">固定シルエット確認</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {AVATAR_PREVIEW_CASES.map((preset) => (
                        <div
                          key={preset.id}
                          className="rounded-xl border border-border/60 bg-background/80 px-2 py-2.5"
                        >
                          <p className="text-center text-[11px] font-medium text-foreground">
                            {preset.label}
                          </p>
                          <div className="mt-1 flex justify-center">
                            <ConstitutionAvatar {...preset.values} size={78} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">寒熱 +4 / -4 の見え方</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {TEMPERATURE_PREVIEW_CASES.map((preset) => (
                        <div
                          key={preset.id}
                          className="rounded-xl border border-border/60 bg-background/80 px-2 py-2.5"
                        >
                          <p className="text-center text-[11px] font-medium text-foreground">
                            {preset.label}
                          </p>
                          <div className="mt-1 flex justify-center">
                            <ConstitutionAvatar {...preset.values} size={78} />
                          </div>
                          <p className="mt-1 text-center text-[10px] text-muted-foreground">
                            {preset.caption}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">寒熱の段階差 +1..+4</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {TEMPERATURE_SCALE_PREVIEW_CASES.map((preset) => (
                        <div
                          key={preset.id}
                          className="rounded-xl border border-border/60 bg-background/80 px-2 py-2.5"
                        >
                          <p className="text-center text-[11px] font-medium text-foreground">
                            {preset.label}
                          </p>
                          <div className="mt-1 flex justify-center">
                            <ConstitutionAvatar {...preset.values} size={78} />
                          </div>
                          <p className="mt-1 text-center text-[10px] text-muted-foreground">
                            {preset.caption}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">燥湿の段階差 +1..+4</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {TEXTURE_SCALE_PREVIEW_CASES.map((preset) => (
                        <div
                          key={preset.id}
                          className="rounded-xl border border-border/60 bg-background/80 px-2 py-2.5"
                        >
                          <p className="text-center text-[11px] font-medium text-foreground">
                            {preset.label}
                          </p>
                          <div className="mt-1 flex justify-center">
                            <ConstitutionAvatar {...preset.values} size={78} />
                          </div>
                          <p className="mt-1 text-center text-[10px] text-muted-foreground">
                            {preset.caption}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* 2. 体質の整理 */}
        {!isFreeAnalysisReport &&
          parsed.sections
          .filter((s) => s.title.includes("体質の整理"))
          .map((section, idx) => (
            <Card
              key={idx}
              className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: "100ms", animationFillMode: "both" }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">体質の整理</CardTitle>
              </CardHeader>
              <CardContent>
                <RichContent text={section.content} />
              </CardContent>
            </Card>
          ))}

        {/* 4. 体質に合う漢方の方向性 */}
        {!isFreeAnalysisReport && parsed.sections.some((s) => s.title.includes("漢方の方向性")) && (
          <Card
            className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: "150ms", animationFillMode: "both" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">体質に合う漢方の方向性</CardTitle>
            </CardHeader>
            <CardContent>
              {parsed.sections
                .filter((s) => s.title.includes("漢方の方向性"))
                .map((section, idx) => (
                  <div key={idx} className="space-y-3">
                    <DirectionContent text={section.content} />
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* 6. 生活改善提案 */}
        {!isFreeAnalysisReport && parsed.recommendations.length > 0 && (
          <Card
            className="mx-auto max-w-3xl border-primary/10 bg-primary/5 animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: "250ms", animationFillMode: "both" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">生活改善提案</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {parsed.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex flex-col gap-1 rounded-lg border border-border/50 bg-background/50 p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary font-bold">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        {rec.title ? (
                          <>
                            <span className="text-sm font-semibold text-foreground">{rec.title}</span>
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                              {rec.content}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {rec.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 7. 受診の目安 */}
        {!isFreeAnalysisReport && parsed.consultationGuidance && (
          <Card
            className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">受診の目安</CardTitle>
            </CardHeader>
            <CardContent>
              <RichContent text={parsed.consultationGuidance} />
            </CardContent>
          </Card>
        )}

        {/* Raw AI Response (collapsible) */}
        {!isFreeAnalysisReport && report.rawResponse && (
          <div className="mx-auto max-w-3xl rounded-lg border border-border bg-muted/30">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex w-full items-center justify-between px-4 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>AI生成テキストを表示</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showRaw ? "rotate-180" : ""}`} />
            </button>
            {showRaw && (
              <div className="border-t border-border px-4 py-3">
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed font-sans">
                  {report.rawResponse}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mx-auto max-w-md space-y-2 pt-2 pb-8">
          <Button className="w-full" onClick={() => router.push("/chat/diagnosis")}>
            もう一度診断する
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
            トップに戻る
          </Button>
        </div>
      </div>
    </div>
  );
}
