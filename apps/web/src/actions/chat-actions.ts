"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendChatMessage } from "@/services/ai-service-client";
import type { ChatMode } from "@studyflow/shared";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return session.user.id;
}

export async function getChatSessions(courseId: string) {
  const userId = await getAuthUserId();
  return prisma.chatSession.findMany({
    where: { courseId, userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      mode: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
}

export async function createChatSession(
  courseId: string,
  mode: ChatMode
): Promise<{ sessionId?: string; error?: string }> {
  const userId = await getAuthUserId();

  const course = await prisma.course.findUnique({
    where: { id: courseId, userId },
    select: { id: true },
  });
  if (!course) return { error: "Course not found" };

  const session = await prisma.chatSession.create({
    data: {
      userId,
      courseId,
      mode,
      title: `Chat — ${new Date().toLocaleDateString()}`,
    },
  });

  revalidatePath(`/courses/${courseId}/chat`);
  return { sessionId: session.id };
}

export async function getChatHistory(sessionId: string) {
  const userId = await getAuthUserId();

  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session || session.userId !== userId) return null;
  return session;
}

export async function sendMessage(
  sessionId: string,
  content: string
): Promise<{ error?: string; messageId?: string }> {
  const userId = await getAuthUserId();

  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 20 },
    },
  });

  if (!session || session.userId !== userId) {
    return { error: "Session not found" };
  }

  // Persist the user message (mode recorded so it's clear what mode was active)
  await prisma.chatMessage.create({
    data: {
      chatSessionId: sessionId,
      role: "USER",
      content,
      mode: session.mode,
    },
  });

  const history = session.messages.map((m) => ({
    role: m.role as "USER" | "ASSISTANT",
    content: m.content,
  }));

  try {
    const aiResponse = await sendChatMessage({
      sessionId,
      courseId: session.courseId,
      message: content,
      mode: session.mode as ChatMode,
      history,
    });

    // Persist the assistant message with full metadata
    const assistantMsg = await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        role: "ASSISTANT",
        content: aiResponse.answer,
        mode: session.mode,
        sources: aiResponse.sources as object[],
        tokenUsage: aiResponse.tokenUsage ?? undefined,
        promptVersion: aiResponse.promptVersion ?? undefined,
      },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return { messageId: assistantMsg.id };
  } catch (err) {
    console.error("[chat-actions] AI service error:", err);
    return { error: "Failed to get AI response. Please try again." };
  }
}

export async function deleteChatSession(
  courseId: string,
  sessionId: string
): Promise<{ error?: string }> {
  const userId = await getAuthUserId();

  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId, userId },
    select: { id: true },
  });
  if (!session) return { error: "Session not found" };

  await prisma.chatSession.delete({ where: { id: sessionId } });
  revalidatePath(`/courses/${courseId}/chat`);
  return {};
}
