import { Mic } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Voice Study Mode" };

export default async function VoicePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <PlaceholderPage
      title="Voice Study Mode"
      description="Study hands-free. Ask questions out loud and hear AI answers spoken back to you — perfect for revision on the go."
      phase="Phase 4"
      icon={Mic}
      backHref={`/courses/${courseId}`}
      backLabel="Back to Overview"
      bullets={[
        "Voice-to-text question input",
        "Text-to-speech AI responses",
        "Supports Notes Only and Hybrid modes",
        "Works while you commute or exercise",
      ]}
    />
  );
}
