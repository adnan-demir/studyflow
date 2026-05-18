import { Brain } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quizzes" };

export default async function QuizzesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <PlaceholderPage
      title="AI Quizzes"
      description="Generate custom quizzes from your course notes. Test your knowledge, track your scores, and identify what needs more review."
      phase="Phase 3"
      icon={Brain}
      backHref={`/courses/${courseId}`}
      backLabel="Back to Overview"
      bullets={[
        "AI-generated multiple-choice questions from your notes",
        "Choose number of questions and specific topics",
        "Instant scoring with explanations",
        "Score history and progress tracking",
      ]}
    />
  );
}
