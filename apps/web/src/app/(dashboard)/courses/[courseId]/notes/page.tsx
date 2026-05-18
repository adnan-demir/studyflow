import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NotesPageClient } from "@/components/notes/notes-page-client";
import { MaterialListSkeleton } from "@/components/notes/material-list";
import { getMaterials } from "@/actions/material-actions";
import { getCourse } from "@/actions/course-actions";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Study Materials" };

async function NotesPageContent({ courseId }: { courseId: string }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const course = await getCourse(courseId);
  if (!course) notFound();

  const raw = await getMaterials(courseId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialMaterials = (raw as any[]).map((m) => ({
    id: m.id,
    originalFilename: m.originalFilename ?? m.name ?? "Unknown",
    mimeType: m.mimeType ?? m.fileType ?? "application/octet-stream",
    fileSize: m.fileSize ?? 0,
    status: m.status,
    processingError: m.processingError ?? null,
    pageCount: m.pageCount ?? null,
    chunkCount: m.chunkCount ?? null,
    createdAt: new Date(m.createdAt).toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Study Materials</h1>
            <p className="text-sm text-muted-foreground">{course.name}</p>
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

      <NotesPageClient courseId={courseId} initialMaterials={initialMaterials} />
    </div>
  );
}

export default async function NotesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <MaterialListSkeleton />
        </div>
      }
    >
      <NotesPageContent courseId={courseId} />
    </Suspense>
  );
}
