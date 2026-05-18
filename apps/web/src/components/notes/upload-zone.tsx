"use client";

import { useRef, useState, useCallback } from "react";
import { UploadCloud, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { uploadMaterial } from "@/actions/material-actions";
import { toast } from "sonner";

const MAX_MB = 50;
const ALLOWED_TYPES = ["application/pdf", "text/plain", "text/markdown"];
const ALLOWED_EXTS = ".pdf, .txt, .md";

interface UploadZoneProps {
  courseId: string;
  onUploadComplete: () => void;
}

export function UploadZone({ courseId, onUploadComplete }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Unsupported file type. Allowed: ${ALLOWED_EXTS}`;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return `File size must be under ${MAX_MB} MB`;
    }
    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];

      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      setPendingFile(file);
      setUploading(true);
      setProgress(10);

      // Simulate progress while the server action runs
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 8, 85));
      }, 400);

      try {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadMaterial(courseId, formData);

        clearInterval(interval);

        if (result.error) {
          toast.error(result.error);
          setProgress(0);
        } else {
          setProgress(100);
          toast.success(
            `"${file.name}" uploaded and queued for processing.`
          );
          setTimeout(() => {
            setProgress(0);
            setPendingFile(null);
            onUploadComplete();
          }, 800);
        }
      } catch {
        clearInterval(interval);
        toast.error("Upload failed. Please try again.");
        setProgress(0);
      } finally {
        setUploading(false);
      }
    },
    [courseId, onUploadComplete]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          uploading && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label="Upload area — click or drag a file"
      >
        <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">
          {dragging ? "Drop file here" : "Click to upload or drag and drop"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, TXT, MD — up to {MAX_MB} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTS}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
      </div>

      {uploading && pendingFile && (
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center gap-2 text-sm">
            <File className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate font-medium">{pendingFile.name}</span>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}
    </div>
  );
}
