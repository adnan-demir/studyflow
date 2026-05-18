import { FileIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "PDF Notes" };

export default async function NotesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <PlaceholderPage
      title="PDF Notes"
      description="Upload your course PDFs and documents. The AI will parse and index them so you can search, annotate, and chat with your notes."
      phase="Phase 2"
      icon={FileIcon}
      backHref={`/courses/${courseId}`}
      backLabel="Back to Overview"
      bullets={[
        "Upload PDFs, DOCX, and text files",
        "Automatic text extraction and chunking",
        "Highlight and annotate passages",
        "Full-text search across all your notes",
      ]}
    />
  );
}
