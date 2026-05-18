"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SummaryType } from "@studyflow/shared";

const TYPES: { value: SummaryType; label: string; description: string }[] = [
  { value: "SHORT", label: "Short", description: "3–5 sentence overview" },
  { value: "DETAILED", label: "Detailed", description: "Full topic coverage with headings" },
  { value: "BULLET", label: "Bullet Points", description: "Grouped bullet-point list" },
  { value: "EXAM_FOCUSED", label: "Exam-Focused", description: "Key terms, formulas, exam topics" },
];

interface SummaryTypeSelectorProps {
  value: SummaryType;
  onChange: (type: SummaryType) => void;
  disabled?: boolean;
}

export function SummaryTypeSelector({
  value,
  onChange,
  disabled,
}: SummaryTypeSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as SummaryType)}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 w-48 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TYPES.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            <div>
              <p className="font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
