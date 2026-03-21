"use client";

import Link from "next/link";
import { ClipboardCheck, MessageCircle, FileText, ChevronRight, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMemo, useState } from "react";
import { getReports } from "@/lib/storage";
import type { DiagnosisReport } from "@/lib/types";
import { AVATAR_SRC, AVATAR_ALT } from "@/lib/constants";
import { useIsClient } from "@/hooks/use-is-client";

function FeatureCard({
  title,
  description,
  icon: Icon,
  href,
  badge,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="transition-all duration-200 hover:border-primary/30 hover:shadow-md active:scale-[0.98]">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-foreground">{title}</span>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </Link>
  );
}

function RecentReportCard({ report }: { report: DiagnosisReport }) {
  const date = new Date(report.createdAt);
  const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;

  return (
    <Link href={`/report/${report.id}`} className="group block">
      <Card className="transition-all duration-200 hover:border-primary/30 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {report.parsed.constitutionType || "体質診断結果"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {report.parsed.summary || report.rawResponse.slice(0, 60) + "…"}
              </p>
            </div>
            <span className="ml-3 shrink-0 text-xs text-muted-foreground">{formattedDate}</span>
          </div>
          {report.parsed.kampoSuggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {report.parsed.kampoSuggestions.slice(0, 3).map((k) => (
                <Badge key={k} variant="outline" className="text-xs">
                  {k}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const isClient = useIsClient();
  const [avatarError, setAvatarError] = useState(false);
  const reports = useMemo<DiagnosisReport[]>(
    () => (isClient ? getReports().slice(0, 3) : []),
    [isClient],
  );

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          {avatarError ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Leaf className="h-7 w-7 text-primary" />
            </div>
          ) : (
            <img
              src={AVATAR_SRC}
              alt={AVATAR_ALT}
              className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm"
              onError={() => setAvatarError(true)}
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">漢方セルフケアAI</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              体質を診断し、漢方的な視点からセルフケアの方向性を提案します
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            体質チェック
          </h2>
          <FeatureCard
            title="体質分析"
            description="今の不調に合わせて質問が変わる対話型。原因の手がかりまで深掘り"
            icon={MessageCircle}
            href="/chat/free"
            badge="20問"
          />
          <FeatureCard
            title="スピード分析"
            description="固定の20問にまとめて回答。短時間で体質の目安を確認できます"
            icon={ClipboardCheck}
            href="/chat/diagnosis"
            badge="20問"
          />
        </section>

        <Separator className="my-8" />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              レポート
            </h2>
            {reports.length > 0 && (
              <Link
                href="/report"
                className="text-xs text-primary hover:underline"
              >
                すべて見る
              </Link>
            )}
          </div>

          {reports.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">診断履歴がありません</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  体質チェックを行うとレポートが作成されます
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <RecentReportCard key={r.id} report={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
