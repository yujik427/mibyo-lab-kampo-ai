"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReports, deleteReport } from "@/lib/storage";
import type { DiagnosisReport } from "@/lib/types";

export default function ReportListPage() {
  const router = useRouter();
  const [reports, setReports] = useState<DiagnosisReport[]>([]);

  useEffect(() => {
    setReports(getReports());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("このレポートを削除しますか？")) return;
    deleteReport(id);
    setReports(getReports());
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {reports.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground">レポートがありません</p>
              <p className="mt-2 text-sm text-muted-foreground">
                体質診断を行うとレポートが自動的に作成されます
              </p>
              <Button className="mt-6" onClick={() => router.push("/chat/diagnosis")}>
                体質診断をはじめる
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const date = new Date(report.createdAt);
              const formatted = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

              return (
                <Link key={report.id} href={`/report/${report.id}`} className="group block">
                  <Card className="transition-all duration-200 hover:border-primary/30 hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {report.parsed.constitutionType || "体質診断結果"}
                            </p>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {report.mode === "diagnosis" ? "20問診断" : "フリー相談"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {report.parsed.summary || report.rawResponse.slice(0, 80)}
                          </p>
                          {report.parsed.kampoSuggestions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {report.parsed.kampoSuggestions.map((k) => (
                                <Badge key={k} variant="outline" className="text-xs">
                                  {k}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">{formatted}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDelete(report.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
