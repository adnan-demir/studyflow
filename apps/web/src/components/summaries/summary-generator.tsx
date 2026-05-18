"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, BookOpen, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SummaryTypeSelector } from "@/components/summaries/summary-type-selector";
import { ChatModeSelector } from "@/components/chat/chat-mode-selector";
import { createSummary } from "@/actions/summary-actions";
import { toast } from "sonner";
import type { ChatMode, SummaryType } from "@studyflow/shared";

type Material = {
  id: string;
  originalFilename: string;
  status: string;
};

interface SummaryGeneratorProps {
  courseId: string;
  materials: Material[];
  onGenerated: (summaryId: string) => void;
}

export function SummaryGenerator({
  courseId,
  materials,
  onGenerated,
}: SummaryGeneratorProps) {
  const [summaryType, setSummaryType] = useState<SummaryType>("SHORT");
  const [mode, setMode] = useState<ChatMode>("HYBRID");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const readyMaterials = materials.filter((m) => m.status === "READY");

  const toggleMaterial = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    startTransition(async () => {
      // Empty selectedIds means "all ready materials"
      const result = await createSummary(courseId, selectedIds, summaryType, mode);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Summary generated");
      onGenerated(result.summaryId!);
    });
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Generate New Summary</h3>
      </div>

      {/* Options row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Type</span>
          <SummaryTypeSelector
            value={summaryType}
            onChange={setSummaryType}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Mode</span>
          <ChatModeSelector
            value={mode}
            onChange={setMode}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Material selection */}
      {readyMaterials.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            Materials to summarise{" "}
            <span className="opacity-60">(leave blank for all)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {readyMaterials.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleMaterial(m.id)}
                disabled={isPending}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  selectedIds.includes(m.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                <FileText className="h-3 w-3" />
                <span className="max-w-[150px] truncate">{m.originalFilename}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {readyMaterials.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No processed materials yet. Upload and wait for processing to complete.
        </p>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isPending || readyMaterials.length === 0}
        size="sm"
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Summary
          </>
        )}
      </Button>
    </div>
  );
}
