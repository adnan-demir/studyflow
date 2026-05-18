import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  BookOpen, FileText, Brain, Target, Flame,
  TrendingUp, Pencil, CalendarDays, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/dashboard/stat-card";
import { ExamCountdown } from "@/components/dashboard/exam-countdown";
import { DeleteCourseButton } from "@/components/courses/delete-course-button";
import { getCourseStats } from "@/actions/course-actions";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Course" };
  const stats = await getCourseStats(courseId);
  return { title: stats?.course.name ?? "Course" };
}

async function CourseOverviewContent({ courseId }: { courseId: string }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const stats = await getCourseStats(courseId);
  if (!stats) notFound();

  const { course, exam, notesCount, quizzesCompleted, avgScore, weakTopicsCount } = stats;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
              <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
          </div>
          {course.description && (
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {course.description}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Created {formatDate(course.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/courses/${courseId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeleteCourseButton courseId={courseId} courseName={course.name} />
        </div>
      </div>

      <Separator />

      {/* Exam countdown */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Exam Status
        </h2>
        {exam ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <ExamCountdown examDate={exam.examDate} className="max-w-xs" />
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Exam date: </span>
              {formatDate(exam.examDate)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <ExamCountdown examDate={null} compact />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/courses/${courseId}/edit`}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Set Exam Date
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Stats grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard
            label="Uploaded Notes"
            value={notesCount}
            icon={FileText}
            description={notesCount === 0 ? "No notes uploaded yet" : `${notesCount} document${notesCount !== 1 ? "s" : ""}`}
            variant={notesCount > 0 ? "success" : "default"}
          />
          <StatCard
            label="Quizzes Completed"
            value={quizzesCompleted}
            icon={Brain}
            description={quizzesCompleted === 0 ? "No quizzes taken yet" : undefined}
          />
          <StatCard
            label="Avg Quiz Score"
            value={avgScore !== null ? `${avgScore.toFixed(0)}%` : "—"}
            icon={BarChart2}
            description={avgScore === null ? "No quiz attempts yet" : undefined}
            variant={
              avgScore === null ? "default"
              : avgScore >= 80 ? "success"
              : avgScore >= 60 ? "warning"
              : "danger"
            }
          />
          <StatCard
            label="Weak Topics"
            value={weakTopicsCount}
            icon={Target}
            description={weakTopicsCount === 0 ? "No weak topics identified" : `${weakTopicsCount} topic${weakTopicsCount !== 1 ? "s" : ""} to review`}
            variant={weakTopicsCount > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Study Streak"
            value="—"
            icon={Flame}
            description="Coming in Phase 2"
            isTodo
          />
          <StatCard
            label="Readiness"
            value="—"
            icon={TrendingUp}
            description="Coming in Phase 2"
            isTodo
          />
        </div>
      </div>

      <Separator />

      {/* Quick links to feature pages */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Features
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "AI Chat", href: `/courses/${courseId}/chat`, badge: "Phase 2" },
            { label: "Summaries", href: `/courses/${courseId}/summaries`, badge: "Phase 3" },
            { label: "Quizzes", href: `/courses/${courseId}/quizzes`, badge: "Phase 3" },
            { label: "PDF Notes", href: `/courses/${courseId}/notes`, badge: "Phase 2" },
            { label: "Weak Topics", href: `/courses/${courseId}/weak-topics`, badge: "Phase 3" },
            { label: "Voice Mode", href: `/courses/${courseId}/voice`, badge: "Phase 4" },
            { label: "Exam Simulation", href: `/courses/${courseId}/exam-simulation`, badge: "Phase 4" },
          ].map(({ label, href, badge }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-center justify-between rounded-lg border bg-card p-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              {label}
              <Badge variant="outline" className="text-[10px]">
                {badge}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <CourseOverviewContent courseId={courseId} />
    </Suspense>
  );
}
