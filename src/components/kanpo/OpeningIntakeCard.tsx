"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OpeningIntakeCardProps {
  disabled?: boolean;
  initialValue?: string;
  onSubmit: (message: string) => void;
}

export function OpeningIntakeCard({
  disabled = false,
  initialValue = "",
  onSubmit,
}: OpeningIntakeCardProps) {
  const [message, setMessage] = useState(initialValue);

  useEffect(() => {
    setMessage(initialValue);
  }, [initialValue]);

  return (
    <Card className="gap-4">
      <CardHeader className="gap-1">
        <CardDescription>開始前の自由入力</CardDescription>
        <CardTitle className="text-lg leading-relaxed">
          まず、今いちばん気になっている不調や相談したいことを自由に書いてください。
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          className="min-h-32 w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
          placeholder="例: 夕方になると頭が重く、会議前は胃がムカムカします。朝も疲れが残りやすいです。"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={disabled}
        />
        <Button
          type="button"
          className="w-full"
          disabled={disabled || !message.trim()}
          onClick={() => onSubmit(message.trim())}
        >
          問診をはじめる
        </Button>
      </CardContent>
    </Card>
  );
}
