import Link from "next/link";
import { BookOpen, ArrowRight, CalendarDays } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExamCountdown } from "@/components/dashboard/exam-countdown";
import { formatDate } from "@/lib/utils";

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    exam: { examDate: Date } | null;
  };
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
            <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-tight">{course.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Created {formatDate(course.createdAt)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {course.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground/60">
            No description
          </p>
        )}

        {course.exam && (
          <div className="mt-3">
            <ExamCountdown examDate={course.exam.examDate} compact />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-xs" asChild>
          <Link href={`/courses/${course.id}`}>
            Open course
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
