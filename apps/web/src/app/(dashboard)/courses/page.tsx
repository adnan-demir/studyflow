import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlusCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Courses" };

async function CoursesContent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const courses = await prisma.course.findMany({
    where: { userId: session.user.id },
    include: { exam: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all your study courses
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
          description="Create your first course and start uploading your notes."
          icon={BookOpen}
          action={
            <Button asChild size="sm">
              <Link href="/courses/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Course
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <CoursesContent />
    </Suspense>
  );
}
