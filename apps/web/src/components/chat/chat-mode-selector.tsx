"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Globe } from "lucide-react";
import type { ChatMode } from "@studyflow/shared";

interface ChatModeSelectorProps {
  value: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

export function ChatModeSelector({
  value,
  onChange,
  disabled,
}: ChatModeSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as ChatMode)}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 w-44 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="NOTES_ONLY">
          <span className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
            Notes Only
          </span>
        </SelectItem>
        <SelectItem value="HYBRID">
          <span className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-emerald-500" />
            Hybrid
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
