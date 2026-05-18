import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseForm } from "@/components/courses/course-form";
import { getCourse } from "@/actions/course-actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Course" };

async function EditCourseContent({ courseId }: { courseId: string }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const course = await getCourse(courseId);
  if (!course) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Edit Course</h1>
          <p className="text-sm text-muted-foreground">{course.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
              <Pencil className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-base">Course Details</CardTitle>
              <CardDescription className="text-xs">
                Update the course name, description, or exam date
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CourseForm
            courseId={courseId}
            defaultValues={{
              name: course.name,
              description: course.description,
              examDate: course.exam?.examDate?.toISOString() ?? null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full max-w-lg" />}>
      <EditCourseContent courseId={courseId} />
    </Suspense>
  );
}
