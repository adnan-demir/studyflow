"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const courseSchema = z.object({
  name: z.string().min(1, "Course name is required").max(100, "Name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  examDate: z.string().optional().nullable(),
});

export type CourseInput = z.infer<typeof courseSchema>;

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return session.user.id;
}

export async function createCourse(
  data: CourseInput
): Promise<{ error?: string }> {
  const userId = await getAuthUserId();

  const parsed = courseSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { name, description, examDate } = parsed.data;

  const course = await prisma.course.create({
    data: {
      name,
      description: description ?? null,
      userId,
    },
  });

  if (examDate) {
    await prisma.exam.create({
      data: {
        courseId: course.id,
        examDate: new Date(examDate),
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/courses");
  redirect(`/courses/${course.id}`);
}

export async function updateCourse(
  courseId: string,
  data: CourseInput
): Promise<{ error?: string }> {
  const userId = await getAuthUserId();

  const parsed = courseSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { name, description, examDate } = parsed.data;

  const existing = await prisma.course.findUnique({
    where: { id: courseId, userId },
  });
  if (!existing) return { error: "Course not found" };

  await prisma.course.update({
    where: { id: courseId },
    data: {
      name,
      description: description ?? null,
    },
  });

  if (examDate) {
    await prisma.exam.upsert({
      where: { courseId },
      update: { examDate: new Date(examDate) },
      create: { courseId, examDate: new Date(examDate) },
    });
  } else {
    await prisma.exam.deleteMany({ where: { courseId } });
  }

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");
  redirect(`/courses/${courseId}`);
}

export async function deleteCourse(courseId: string): Promise<{ error?: string }> {
  const userId = await getAuthUserId();

  const existing = await prisma.course.findUnique({
    where: { id: courseId, userId },
  });
  if (!existing) return { error: "Course not found" };

  await prisma.course.delete({ where: { id: courseId } });

  revalidatePath("/dashboard");
  revalidatePath("/courses");
  redirect("/dashboard");
}

export async function getCourses() {
  const userId = await getAuthUserId();

  return prisma.course.findMany({
    where: { userId },
    include: { exam: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCourse(courseId: string) {
  const userId = await getAuthUserId();

  const course = await prisma.course.findUnique({
    where: { id: courseId, userId },
    include: { exam: true },
  });

  return course;
}

export async function getCourseStats(courseId: string) {
  const userId = await getAuthUserId();

  const [course, notesCount, quizAttempts, weakTopicsCount] =
    await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId, userId },
        include: { exam: true },
      }),
      prisma.studyMaterial.count({ where: { courseId } }),
      prisma.quizAttempt.findMany({
        where: { quiz: { courseId }, userId },
        select: { score: true },
      }),
      prisma.weakTopic.count({ where: { courseId, userId } }),
    ]);

  if (!course) return null;

  const quizzesCompleted = quizAttempts.length;
  const avgScore =
    quizzesCompleted > 0
      ? quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizzesCompleted
      : null;

  return {
    course,
    exam: course.exam,
    notesCount,
    quizzesCompleted,
    avgScore,
    weakTopicsCount,
  };
}
