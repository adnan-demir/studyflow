import { FileText } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Summaries" };

export default async function SummariesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <PlaceholderPage
      title="AI Summaries"
      description="Automatically generate concise summaries of your course notes and study materials using AI."
      phase="Phase 3"
      icon={FileText}
      backHref={`/courses/${courseId}`}
      backLabel="Back to Overview"
      bullets={[
        "Generate summaries from uploaded PDFs and notes",
        "Topic-specific summaries for targeted review",
        "Save and browse past summaries",
        "Export summaries to PDF",
      ]}
    />
  );
}
