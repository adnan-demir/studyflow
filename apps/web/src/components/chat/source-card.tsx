import { BookOpen, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SourceReference } from "@studyflow/shared";

interface SourceCardProps {
  source: SourceReference;
  index: number;
}

export function SourceCard({ source, index }: SourceCardProps) {
  const scoreLabel =
    source.similarityScore !== undefined
      ? `${(source.similarityScore * 100).toFixed(0)}% match`
      : null;

  return (
    <div className="rounded-lg border bg-muted/40 p-3 text-xs">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">
          <span className="text-[10px] font-bold">{index}</span>
        </div>
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate font-medium text-foreground">
          {source.documentName}
        </span>
        {source.pageNumber && (
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
            p.{source.pageNumber}
          </Badge>
        )}
        {scoreLabel && (
          <span className="text-muted-foreground">{scoreLabel}</span>
        )}
      </div>
      <p className="line-clamp-2 text-muted-foreground">{source.chunkPreview}</p>
    </div>
  );
}

interface SourceListProps {
  sources: SourceReference[];
  label?: string;
}

export function SourceList({ sources, label = "Sources" }: SourceListProps) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" />
        {label} ({sources.length})
      </div>
      <div className="space-y-1.5">
        {sources.map((s, i) => (
          <SourceCard key={`${s.documentId}-${i}`} source={s} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
