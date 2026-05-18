"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Send, Loader2, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatModeSelector } from "@/components/chat/chat-mode-selector";
import {
  createChatSession,
  getChatHistory,
  sendMessage,
  deleteChatSession,
} from "@/actions/chat-actions";
import { toast } from "sonner";
import type { ChatMode, SourceReference } from "@studyflow/shared";
import { formatDate } from "@/lib/utils";

type Session = {
  id: string;
  title: string | null;
  mode: string;
  updatedAt: Date;
  _count: { messages: number };
};

type Message = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources: SourceReference[] | null;
  createdAt: Date;
};

interface ChatInterfaceProps {
  courseId: string;
  initialSessions: Session[];
}

export function ChatInterface({ courseId, initialSessions }: ChatInterfaceProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessions[0]?.id ?? null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("HYBRID");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load history when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    setLoadingHistory(true);
    getChatHistory(activeSessionId)
      .then((session) => {
        if (session) {
          setMessages(
            session.messages.map((m) => ({
              ...m,
              role: m.role as "USER" | "ASSISTANT",
              sources: (m.sources as unknown as SourceReference[]) ?? null,
            }))
          );
          setMode(session.mode as ChatMode);
        }
      })
      .finally(() => setLoadingHistory(false));
  }, [activeSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleNewSession = () => {
    startTransition(async () => {
      const result = await createChatSession(courseId, mode);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const newSession: Session = {
        id: result.sessionId!,
        title: `Chat — ${new Date().toLocaleDateString()}`,
        mode,
        updatedAt: new Date(),
        _count: { messages: 0 },
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(result.sessionId!);
      setMessages([]);
    });
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const result = await deleteChatSession(courseId, sessionId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setActiveSessionId(remaining[0]?.id ?? null);
      }
    });
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isThinking) return;

    // Use a local variable so we always have the real ID even when state
    // hasn't re-rendered yet (React state updates are async).
    let sessionId = activeSessionId;

    if (!sessionId) {
      const created = await createChatSession(courseId, mode);
      if (created.error) {
        toast.error(created.error);
        return;
      }
      sessionId = created.sessionId!;
      const newSession: Session = {
        id: sessionId,
        title: `Chat — ${new Date().toLocaleDateString()}`,
        mode,
        updatedAt: new Date(),
        _count: { messages: 0 },
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(sessionId);
    }

    // Optimistic user message
    const userMsg: Message = {
      id: `tmp-${Date.now()}`,
      role: "USER",
      content,
      sources: null,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    const result = await sendMessage(sessionId, content);
    setIsThinking(false);

    if (result.error) {
      toast.error(result.error);
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(content);
      return;
    }

    // Reload full history to get the persisted assistant message with sources
    const updated = await getChatHistory(sessionId);
    if (updated) {
      setMessages(
        updated.messages.map((m) => ({
          ...m,
          role: m.role as "USER" | "ASSISTANT",
          sources: (m.sources as unknown as SourceReference[]) ?? null,
        }))
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-xl border bg-card">
      {/* Session sidebar */}
      <div className="flex w-56 flex-col border-r">
        <div className="flex items-center justify-between p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Chats
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleNewSession}
            disabled={isPending}
            title="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="space-y-0.5 p-2">
            {sessions.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No chats yet
              </p>
            )}
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`group flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors ${
                  activeSessionId === s.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/60 text-muted-foreground"
                }`}
              >
                <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{s.title ?? "Chat"}</p>
                  <p className="text-[10px] opacity-70">{s._count.messages} messages</p>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:text-destructive"
                  title="Delete chat"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <p className="text-sm font-medium">
            {sessions.find((s) => s.id === activeSessionId)?.title ?? "New chat"}
          </p>
          <ChatModeSelector
            value={mode}
            onChange={setMode}
            disabled={isThinking}
          />
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {loadingHistory && (
              <>
                <MessageSkeleton isUser />
                <MessageSkeleton />
              </>
            )}

            {!loadingHistory && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">
                  Start a conversation
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Ask anything about your uploaded course notes
                </p>
              </div>
            )}

            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                role={m.role}
                content={m.content}
                sources={m.sources ?? undefined}
              />
            ))}

            {isThinking && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
              className="min-h-[44px] max-h-32 resize-none text-sm"
              disabled={isThinking}
              rows={1}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="shrink-0"
            >
              {isThinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            {mode === "NOTES_ONLY"
              ? "Notes Only — answers use only your uploaded materials"
              : "Hybrid — combines your notes with general AI knowledge"}
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageSkeleton({ isUser }: { isUser?: boolean }) {
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <Skeleton className={`h-16 rounded-2xl ${isUser ? "w-48" : "w-72"}`} />
    </div>
  );
}
