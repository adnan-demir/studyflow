"use client";

import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/notes/upload-zone";
import { MaterialList } from "@/components/notes/material-list";
import { Separator } from "@/components/ui/separator";

type SerializedMaterial = {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: string;
  processingError: string | null;
  pageCount: number | null;
  chunkCount: number | null;
  createdAt: string;
};

interface NotesPageClientProps {
  courseId: string;
  initialMaterials: SerializedMaterial[];
}

export function NotesPageClient({ courseId, initialMaterials }: NotesPageClientProps) {
  const router = useRouter();

  const materials = initialMaterials.map((m) => ({
    ...m,
    createdAt: new Date(m.createdAt),
  }));

  return (
    <>
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Upload a Document
        </h2>
        <UploadZone courseId={courseId} onUploadComplete={() => router.refresh()} />
      </div>

      <Separator />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Uploaded Files
          </h2>
          <span className="text-xs text-muted-foreground">
            {materials.length} file{materials.length !== 1 ? "s" : ""}
          </span>
        </div>
        <MaterialList materials={materials} courseId={courseId} />
      </div>
    </>
  );
}
