"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCourse, updateCourse } from "@/actions/course-actions";

const formSchema = z.object({
  name: z.string().min(1, "Course name is required").max(100),
  description: z.string().max(1000).optional(),
  examDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CourseFormProps {
  courseId?: string;
  defaultValues?: {
    name: string;
    description?: string | null;
    examDate?: string | null;
  };
}

export function CourseForm({ courseId, defaultValues }: CourseFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      examDate: defaultValues?.examDate
        ? new Date(defaultValues.examDate).toISOString().split("T")[0]
        : "",
    },
  });

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      const result = courseId
        ? await updateCourse(courseId, {
            ...data,
            examDate: data.examDate || null,
          })
        : await createCourse({
            ...data,
            examDate: data.examDate || null,
          });

      if (result?.error) {
        toast.error(result.error);
      }
      // On success, the action redirects automatically
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Course Name *</Label>
        <Input
          id="name"
          placeholder="e.g. Introduction to Calculus"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of what this course covers..."
          rows={3}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="examDate">Exam Date (optional)</Label>
        <Input
          id="examDate"
          type="date"
          {...register("examDate")}
        />
        <p className="text-xs text-muted-foreground">
          Set an exam date to enable the countdown timer.
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending
          ? courseId
            ? "Saving…"
            : "Creating…"
          : courseId
          ? "Save Changes"
          : "Create Course"}
      </Button>
    </form>
  );
}
