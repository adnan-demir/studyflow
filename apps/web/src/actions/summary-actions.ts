"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateSummary } from "@/services/ai-service-client";
import type { ChatMode, SummaryType } from "@studyflow/shared";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return session.user.id;
}

export async function getSummaries(courseId: string) {
  const userId = await getAuthUserId();

  return prisma.summary.findMany({
    where: { courseId, userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      summaryType: true,
      mode: true,
      createdAt: true,
    },
  });
}

export async function getSummary(summaryId: string) {
  const userId = await getAuthUserId();

  return prisma.summary.findFirst({
    where: { id: summaryId, userId },
  });
}

export async function createSummary(
  courseId: string,
  materialIds: string[],
  summaryType: SummaryType,
  mode: ChatMode
): Promise<{ error?: string; summaryId?: string }> {
  const userId = await getAuthUserId();

  const course = await prisma.course.findUnique({
    where: { id: courseId, userId },
    select: { id: true },
  });
  if (!course) return { error: "Course not found" };

  // Verify at least one READY material exists for this course
  const readyCount = await prisma.studyMaterial.count({
    where: {
      courseId,
      userId,
      status: "READY",
      ...(materialIds.length > 0 ? { id: { in: materialIds } } : {}),
    },
  });

  if (readyCount === 0) {
    return {
      error:
        "No processed materials found. Please upload and wait for processing to complete.",
    };
  }

  try {
    const aiResponse = await generateSummary({
      courseId,
      materialIds,
      summaryType,
      mode,
    });

    const summary = await prisma.summary.create({
      data: {
        courseId,
        userId,
        title: aiResponse.title,
        content: aiResponse.content,
        summaryType,
        mode,
        sources: aiResponse.sources as object[],
        materialIds: materialIds as unknown as object,
      },
    });

    revalidatePath(`/courses/${courseId}/summaries`);
    return { summaryId: summary.id };
  } catch (err) {
    console.error("Summary generation error:", err);
    return { error: "Failed to generate summary. Please try again." };
  }
}

export async function deleteSummary(
  courseId: string,
  summaryId: string
): Promise<{ error?: string }> {
  const userId = await getAuthUserId();

  const summary = await prisma.summary.findFirst({
    where: { id: summaryId, userId, courseId },
  });
  if (!summary) return { error: "Summary not found" };

  await prisma.summary.delete({ where: { id: summaryId } });
  revalidatePath(`/courses/${courseId}/summaries`);
  return {};
}
