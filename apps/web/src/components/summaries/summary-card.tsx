"use client";

import { useState } from "react";
import { FileText, Trash2, Loader2, ChevronDown, ChevronUp, BookOpen, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SourceList } from "@/components/chat/source-card";
import { deleteSummary } from "@/actions/summary-actions";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { SourceReference } from "@studyflow/shared";

const TYPE_LABELS: Record<string, string> = {
  SHORT: "Short",
  DETAILED: "Detailed",
  BULLET: "Bullet",
  EXAM_FOCUSED: "Exam-Focused",
};

type Summary = {
  id: string;
  title: string;
  content: string;
  summaryType: string;
  mode: string;
  sources: unknown;
  createdAt: Date;
};

interface SummaryCardProps {
  summary: Summary;
  courseId: string;
  onDeleted: (id: string) => void;
}

export function SummaryCard({ summary, courseId, onDeleted }: SummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sources = (summary.sources as SourceReference[]) ?? [];

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteSummary(courseId, summary.id);
    setDeleting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Summary deleted");
      onDeleted(summary.id);
    }
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold">{summary.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              {TYPE_LABELS[summary.summaryType] ?? summary.summaryType}
            </Badge>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              {summary.mode === "NOTES_ONLY" ? (
                <><BookOpen className="h-2.5 w-2.5" /> Notes Only</>
              ) : (
                <><Globe className="h-2.5 w-2.5" /> Hybrid</>
              )}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatDate(summary.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Collapsed preview */}
      {!expanded && (
        <div className="px-4 pb-3">
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {summary.content}
          </p>
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="border-t px-4 py-3">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {summary.content}
            </pre>
          </div>
          {sources.length > 0 && <SourceList sources={sources} />}
        </div>
      )}
    </div>
  );
}
