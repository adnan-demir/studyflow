import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlusCircle, BookOpen, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function DashboardContent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const courses = await prisma.course.findMany({
    where: { userId: session.user.id },
    include: { exam: true },
    orderBy: { updatedAt: "desc" },
  });

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good day, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {courses.length === 0
              ? "Create your first course to get started."
              : `You have ${courses.length} course${courses.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/courses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create your first course to start uploading notes and studying with AI."
          icon={BookOpen}
          action={
            <Button asChild size="sm">
              <Link href="/courses/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Course
              </Link>
            </Button>
          }
        />
      ) : (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Your Courses
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
