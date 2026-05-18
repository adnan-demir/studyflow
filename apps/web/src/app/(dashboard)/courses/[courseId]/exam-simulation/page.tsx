import { GraduationCap } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Exam Simulation" };

export default async function ExamSimulationPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <PlaceholderPage
      title="Exam Simulation"
      description="Simulate a full exam experience under timed conditions. Questions are generated from your notes to match real exam difficulty."
      phase="Phase 4"
      icon={GraduationCap}
      backHref={`/courses/${courseId}`}
      backLabel="Back to Overview"
      bullets={[
        "Full timed exam with configurable duration",
        "Randomized questions from your notes",
        "Post-exam detailed analysis and score breakdown",
        "Compare results across multiple simulation attempts",
      ]}
    />
  );
}
