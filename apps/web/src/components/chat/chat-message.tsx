import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourceList } from "@/components/chat/source-card";
import type { SourceReference } from "@studyflow/shared";

interface ChatMessageProps {
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: SourceReference[];
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  sources,
  isStreaming,
}: ChatMessageProps) {
  const isUser = role === "USER";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted/60 text-foreground"
        )}
      >
        {/* Preserve line breaks in the AI response */}
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {content}
          {isStreaming && (
            <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-current" />
          )}
        </div>

        {!isUser && sources && sources.length > 0 && (
          <SourceList sources={sources} />
        )}
      </div>
    </div>
  );
}
