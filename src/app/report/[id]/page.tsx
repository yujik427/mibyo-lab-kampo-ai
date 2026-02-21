"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Leaf, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getReportById } from "@/lib/storage";
import type { DiagnosisReport } from "@/lib/types";
import { ConstitutionChart } from "@/components/report/constitution-chart";

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

        const boldText = trimmed.replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="text-foreground font-medium">$1</strong>',
        );
        if (boldText !== trimmed) {
          return <p key={i} dangerouslySetInnerHTML={{ __html: boldText }} />;
        }

        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<DiagnosisReport | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    const found = getReportById(id);
    if (found) {
      setReport(found);
    } else {
      setNotFound(true);
    }
  }, [params.id]);

  if (notFound) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-4">
        <p className="text-lg font-semibold text-foreground">レポートが見つかりません</p>
        <Button className="mt-4" onClick={() => router.push("/report")}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  const date = new Date(report.createdAt);
  const formatted = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3">
        <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.push("/report")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-sm font-semibold text-foreground">診断レポート</h1>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {/* Title Card */}
        <Card className="border-2 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader className="pb-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl text-center text-foreground">
              {report.parsed.constitutionType || "体質診断結果"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground leading-relaxed">
              {report.parsed.summary}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {report.mode === "diagnosis" ? "20問診断" : "フリー相談"}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatted}</span>
            </div>
          </CardContent>
        </Card>

        {/* Kampo Suggestions */}
        {report.parsed.kampoSuggestions.length > 0 && (
          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  漢
                </span>
                推奨漢方候補
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {report.parsed.kampoSuggestions.map((k) => (
                  <Badge key={k} variant="outline" className="text-sm py-1 px-3">
                    {k}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Constitution Chart */}
        {report.answers && Object.keys(report.answers).length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <ConstitutionChart answers={report.answers} />
          </div>
        )}

        {/* Sections */}
        {report.parsed.sections.map((section, idx) => (
          <Card key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${150 + idx * 50}ms`, animationFillMode: "both" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {idx + 1}
                </span>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RichContent text={section.content} />
            </CardContent>
          </Card>
        ))}

        {/* Recommendations */}
        {report.parsed.recommendations.length > 0 && (
          <>
            <Separator />
            <Card className="border-primary/10 bg-primary/5 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">生活改善ポイント</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.parsed.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary font-bold">
                        {idx + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {/* Raw AI Response (collapsible) */}
        {report.rawResponse && (
          <div className="rounded-lg border border-border bg-muted/30">
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
        <div className="space-y-2 pt-2 pb-8">
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
