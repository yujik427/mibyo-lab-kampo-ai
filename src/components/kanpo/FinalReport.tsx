"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinalReportProps {
  content: string;
  loading?: boolean;
  error?: string | null;
}

function renderLine(line: string, index: number) {
  const trimmed = line.trim();
  if (!trimmed) {
    return <div key={`space-${index}`} className="h-2" />;
  }
  if (trimmed.startsWith("## ")) {
    return (
      <h3 key={`heading-${index}`} className="text-base font-semibold text-foreground">
        {trimmed.replace(/^##\s*/, "")}
      </h3>
    );
  }
  if (trimmed.startsWith("- ")) {
    return (
      <li key={`bullet-${index}`} className="ml-5 list-disc text-sm leading-7 text-foreground">
        {trimmed.slice(2)}
      </li>
    );
  }
  return (
    <p key={`text-${index}`} className="text-sm leading-7 text-foreground">
      {trimmed}
    </p>
  );
}

export function FinalReport({ content, loading = false, error = null }: FinalReportProps) {
  return (
    <Card className="gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">最終レポート</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">AIが最終レポートを生成しています...</p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {error}
          </p>
        ) : null}
        {!loading && !content ? (
          <p className="text-sm text-muted-foreground">20問完了後に、ここへ最終レポートを表示します。</p>
        ) : null}
        {!loading && content ? (
          <div className="space-y-2">{content.split("\n").map((line, index) => renderLine(line, index))}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
