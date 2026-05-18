"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { processDocument } from "@/services/ai-service-client";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "text/plain", "text/markdown"]);
// Accept common mis-reported MIME types browsers send for .md files
const ALLOWED_MIME_ALIASES: Record<string, string> = {
  "text/x-markdown": "text/markdown",
  "text/x-tex": "text/plain",
};

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return session.user.id;
}

function getUploadsDir(): string {
  return path.join(process.cwd(), "uploads");
}

function normaliseMimeType(raw: string): string {
  return ALLOWED_MIME_ALIASES[raw] ?? raw;
}

export async function uploadMaterial(
  courseId: string,
  formData: FormData
): Promise<{ error?: string; materialId?: string }> {
  const userId = await getAuthUserId();

  const course = await prisma.course.findUnique({
    where: { id: courseId, userId },
    select: { id: true },
  });
  if (!course) return { error: "Course not found" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const mimeType = normaliseMimeType(file.type);

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { error: "Only PDF, plain-text (.txt), or Markdown (.md) files are supported" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: `File size must be under ${MAX_FILE_SIZE / (1024 * 1024)} MB` };
  }

  if (file.size === 0) {
    return { error: "File appears to be empty" };
  }

  // Duplicate filename guard — warn if the same original filename already exists
  // for this course. We still allow it (stored with a new UUID), but surface it.
  const existingDuplicate = await prisma.studyMaterial.findFirst({
    where: { courseId, userId, originalFilename: file.name, status: { not: "FAILED" } },
    select: { id: true },
  });
  if (existingDuplicate) {
    return {
      error: `A file named "${file.name}" has already been uploaded for this course. Rename the file or delete the existing one before re-uploading.`,
    };
  }

  const ext = path.extname(file.name) || "";
  const storedFilename = `${crypto.randomUUID()}${ext}`;

  const uploadsDir = path.join(getUploadsDir(), userId, courseId);
  await mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, storedFilename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Create the StudyMaterial record (PENDING)
  const material = await prisma.studyMaterial.create({
    data: {
      userId,
      courseId,
      originalFilename: file.name,
      storedFilename,
      mimeType,
      fileSize: file.size,
      status: "PENDING",
    },
  });

  // Trigger AI service processing asynchronously.
  // If the AI service is unreachable or errors, status stays PENDING and the user
  // will see it in the UI — they can delete and re-upload.
  processDocument({
    materialId: material.id,
    courseId,
    filePath,
    mimeType,
  }).catch((err) => {
    console.error("[material-actions] AI processing error:", err);
    // The AI service itself updates status to FAILED via SQL; no action needed here.
  });

  revalidatePath(`/courses/${courseId}/notes`);
  return { materialId: material.id };
}

export async function getMaterials(courseId: string) {
  const userId = await getAuthUserId();

  const course = await prisma.course.findUnique({
    where: { id: courseId, userId },
    select: { id: true },
  });
  if (!course) return [];

  return prisma.studyMaterial.findMany({
    where: { courseId, userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      originalFilename: true,
      mimeType: true,
      fileSize: true,
      status: true,
      processingError: true,
      pageCount: true,
      chunkCount: true,
      processedAt: true,
      createdAt: true,
    },
  });
}

export async function deleteMaterial(
  courseId: string,
  materialId: string
): Promise<{ error?: string }> {
  const userId = await getAuthUserId();

  const material = await prisma.studyMaterial.findUnique({
    where: { id: materialId, userId, courseId },
    select: { id: true, storedFilename: true },
  });
  if (!material) return { error: "Material not found" };

  await prisma.studyMaterial.delete({ where: { id: materialId } });

  // Best-effort file cleanup — don't fail the delete if the file is already gone
  const filePath = path.join(getUploadsDir(), userId, courseId, material.storedFilename);
  await unlink(filePath).catch(() => undefined);

  revalidatePath(`/courses/${courseId}/notes`);
  return {};
}
