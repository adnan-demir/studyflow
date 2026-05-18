import Link from "next/link";
import { MessageSquare, Zap, BookOpen, Globe } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Chat" };

export default async function ChatPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <PlaceholderPage
      title="AI Chat"
      description="Chat with an AI tutor trained on your uploaded course notes. Get instant answers, explanations, and study guidance."
      phase="Phase 2"
      icon={MessageSquare}
      backHref={`/courses/${courseId}`}
      backLabel="Back to Overview"
      bullets={[
        "Notes Only mode — answers based solely on your uploads",
        "Hybrid mode — combines your notes with general AI knowledge",
        "Source transparency — every answer shows exactly where it came from",
        "Conversation history — pick up where you left off",
      ]}
    />
  );
}
