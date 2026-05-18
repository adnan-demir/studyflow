import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChatInterface } from "@/components/chat/chat-interface";
import { getChatSessions } from "@/actions/chat-actions";
import { getCourse } from "@/actions/course-actions";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Chat" };

async function ChatPageContent({ courseId }: { courseId: string }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const course = await getCourse(courseId);
  if (!course) notFound();

  const sessions = await getChatSessions(courseId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
            <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Chat</h1>
            <p className="text-sm text-muted-foreground">{course.name}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Overview
          </Link>
        </Button>
      </div>

      {/* Chat interface (client component) */}
      <ChatInterface
        courseId={courseId}
        initialSessions={sessions.map((s) => ({
          ...s,
          updatedAt: new Date(s.updatedAt),
        }))}
      />
    </div>
  );
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-[calc(100vh-12rem)] w-full rounded-xl" />
        </div>
      }
    >
      <ChatPageContent courseId={courseId} />
    </Suspense>
  );
}
