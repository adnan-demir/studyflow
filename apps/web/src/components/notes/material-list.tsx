"use client";

import { useState } from "react";
import { FileText, File, Loader2, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteMaterial } from "@/actions/material-actions";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Material = {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: string;
  processingError: string | null;
  pageCount: number | null;
  chunkCount: number | null;
  createdAt: Date;
};

interface MaterialListProps {
  materials: Material[];
  courseId: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "READY") {
    return (
      <Badge variant="outline" className="gap-1 border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        Ready
      </Badge>
    );
  }
  if (status === "PROCESSING") {
    return (
      <Badge variant="outline" className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing
      </Badge>
    );
  }
  if (status === "FAILED") {
    return (
      <Badge variant="outline" className="gap-1 border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Loader2 className="h-3 w-3 animate-spin" />
      Pending
    </Badge>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MaterialList({ materials, courseId }: MaterialListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    const result = await deleteMaterial(courseId, id);
    setDeletingId(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`"${name}" deleted`);
    }
  };

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">No files uploaded yet</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Upload PDFs or text files above to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {materials.map((m) => (
        <div
          key={m.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border bg-card p-3 transition-opacity",
            deletingId === m.id && "opacity-50"
          )}
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
            {m.mimeType === "application/pdf" ? (
              <FileText className="h-4 w-4 text-red-500" />
            ) : (
              <File className="h-4 w-4 text-blue-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{m.originalFilename}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{formatBytes(m.fileSize)}</span>
              {m.pageCount && <span>{m.pageCount} pages</span>}
              {m.chunkCount && <span>{m.chunkCount} chunks indexed</span>}
              <span>{formatDate(m.createdAt)}</span>
            </div>
            {m.status === "FAILED" && m.processingError && (
              <p className="mt-1 text-xs text-red-500">{m.processingError}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={m.status} />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(m.id, m.originalFilename)}
              disabled={deletingId === m.id}
              aria-label={`Delete ${m.originalFilename}`}
            >
              {deletingId === m.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MaterialListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
