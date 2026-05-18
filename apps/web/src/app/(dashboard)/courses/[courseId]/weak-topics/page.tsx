import { Target } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Weak Topics" };

export default async function WeakTopicsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <PlaceholderPage
      title="Weak Topics"
      description="AI analysis of your quiz results and study patterns identifies the topics where you need the most improvement."
      phase="Phase 3"
      icon={Target}
      backHref={`/courses/${courseId}`}
      backLabel="Back to Overview"
      bullets={[
        "Automatically identified from quiz performance",
        "Confidence score per topic (0–100%)",
        "Direct links to relevant notes and quizzes",
        "Track improvement over time",
      ]}
    />
  );
}
