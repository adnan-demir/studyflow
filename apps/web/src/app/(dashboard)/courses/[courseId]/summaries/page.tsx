"use client";

import { useState, useEffect, useTransition } from "react";
import { FileText, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryGenerator } from "@/components/summaries/summary-generator";
import { SummaryCard } from "@/components/summaries/summary-card";
import { getSummaries, getSummary } from "@/actions/summary-actions";
import { getMaterials } from "@/actions/material-actions";
import Link from "next/link";
import { useParams } from "next/navigation";

type SummaryListItem = {
  id: string;
  title: string;
  summaryType: string;
  mode: string;
  createdAt: Date;
};

type SummaryFull = {
  id: string;
  title: string;
  content: string;
  summaryType: string;
  mode: string;
  sources: unknown;
  createdAt: Date;
  updatedAt: Date;
  courseId: string;
  userId: string;
  materialIds: unknown;
};

type Material = {
  id: string;
  originalFilename: string;
  status: string;
};

export default function SummariesPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const [summaryList, setSummaryList] = useState<SummaryListItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadedSummaries, setLoadedSummaries] = useState<Record<string, SummaryFull>>({});
  const [loading, setLoading] = useState(true);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      getSummaries(courseId),
      getMaterials(courseId),
    ]).then(([sums, mats]) => {
      setSummaryList(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sums as any[]).map((s) => ({
          id: s.id,
          title: s.title,
          summaryType: s.summaryType ?? "SHORT",
          mode: s.mode ?? "HYBRID",
          createdAt: new Date(s.createdAt),
        }))
      );
      setMaterials(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mats as any[]).map((m) => ({
          id: m.id,
          originalFilename: m.originalFilename ?? m.name ?? "Unknown",
          status: m.status,
        }))
      );
      setLoading(false);
    });
  }, [courseId]);

  const handleGenerated = async (summaryId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fresh = await getSummary(summaryId) as any;
    if (fresh) {
      const item: SummaryListItem = {
        id: fresh.id,
        title: fresh.title,
        summaryType: fresh.summaryType ?? "SHORT",
        mode: fresh.mode ?? "HYBRID",
        createdAt: new Date(fresh.createdAt),
      };
      setSummaryList((prev) => [item, ...prev]);
      const full: SummaryFull = {
        ...fresh,
        summaryType: fresh.summaryType ?? "SHORT",
        mode: fresh.mode ?? "HYBRID",
        sources: fresh.sources ?? null,
        materialIds: fresh.materialIds ?? null,
        createdAt: new Date(fresh.createdAt),
        updatedAt: new Date(fresh.updatedAt),
      };
      setLoadedSummaries((prev) => ({ ...prev, [fresh.id]: full }));
    }
  };

  const handleExpand = async (id: string) => {
    if (loadedSummaries[id]) return;
    setLoadingIds((prev) => new Set(prev).add(id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await getSummary(id) as any;
    if (data) {
      const full: SummaryFull = {
        ...data,
        summaryType: data.summaryType ?? "SHORT",
        mode: data.mode ?? "HYBRID",
        sources: data.sources ?? null,
        materialIds: data.materialIds ?? null,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
      setLoadedSummaries((prev) => ({ ...prev, [id]: full }));
    }
    setLoadingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handleDeleted = (id: string) => {
    setSummaryList((prev) => prev.filter((s) => s.id !== id));
    setLoadedSummaries((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Summaries</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Overview
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Generator */}
      <SummaryGenerator
        courseId={courseId}
        materials={materials}
        onGenerated={handleGenerated}
      />

      <Separator />

      {/* Summary list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Saved Summaries
          </h2>
          <span className="text-xs text-muted-foreground">
            {summaryList.length} summary{summaryList.length !== 1 ? "ies" : "y"}
          </span>
        </div>

        {summaryList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
            <Sparkles className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No summaries yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Generate your first summary above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {summaryList.map((s) => {
              const full = loadedSummaries[s.id];
              const isLoading = loadingIds.has(s.id);

              if (!full && !isLoading) {
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border bg-card p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleExpand(s.id)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{s.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        Click to load
                      </span>
                    </div>
                  </div>
                );
              }

              if (isLoading) {
                return <Skeleton key={s.id} className="h-20 w-full rounded-xl" />;
              }

              return (
                <SummaryCard
                  key={s.id}
                  summary={full!}
                  courseId={courseId}
                  onDeleted={handleDeleted}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
