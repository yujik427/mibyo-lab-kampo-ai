"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

interface ChatBubbleProps {
  message: ChatMessage;
  isTyping?: boolean;
}

function FormattedContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`list-${elements.length}`} className="space-y-0.5 pl-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
            <span>{item}</span>
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const bulletMatch = trimmed.match(/^[・\-\*]\s*(.+)/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
    } else {
      flushList();
      if (trimmed === "") {
        elements.push(<div key={`br-${i}`} className="h-1" />);
      } else {
        elements.push(<p key={`p-${i}`}>{trimmed}</p>);
      }
    }
  }
  flushList();

  return <div className="space-y-1">{elements}</div>;
}

export function ChatBubble({ message, isTyping }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.role === "error";

  return (
    <div className={cn("flex animate-in fade-in slide-in-from-bottom-1 duration-200", isUser ? "justify-end" : "justify-start")}>
      {isTyping ? (
        <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-muted px-3 py-2.5 text-sm text-muted-foreground">
          整えてます
          <span className="inline-flex ml-0.5">
            <span className="animate-bounce inline-block" style={{ animationDelay: "0s" }}>.</span>
            <span className="animate-bounce inline-block" style={{ animationDelay: "0.15s" }}>.</span>
            <span className="animate-bounce inline-block" style={{ animationDelay: "0.3s" }}>.</span>
          </span>
        </div>
      ) : (
        <div
          className={cn(
            "max-w-[78%] rounded-2xl border px-3 py-2.5 text-sm leading-relaxed shadow-sm",
            isUser && "bg-primary text-primary-foreground border-primary/25 rounded-br-md",
            !isUser && !isError && "bg-muted text-foreground border-border rounded-bl-md",
            isError && "bg-destructive/10 text-destructive border-destructive/25",
          )}
        >
          {isUser ? message.content : <FormattedContent text={message.content} />}
        </div>
      )}
    </div>
  );
}
