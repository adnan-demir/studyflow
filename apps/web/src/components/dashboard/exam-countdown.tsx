import { CalendarDays, CalendarCheck, CalendarX, CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getExamCountdown } from "@/lib/utils";
import type { ExamCountdownVariant } from "@studyflow/shared/types";

interface ExamCountdownProps {
  examDate: Date | string | null | undefined;
  className?: string;
  compact?: boolean;
}

const variantConfig: Record<
  ExamCountdownVariant,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  upcoming: { icon: CalendarDays, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
  today: { icon: CalendarCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  passed: { icon: CalendarX, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50" },
  none: { icon: CalendarOff, color: "text-muted-foreground", bg: "bg-muted" },
};

export function ExamCountdown({ examDate, className, compact = false }: ExamCountdownProps) {
  const countdown = getExamCountdown(
    examDate instanceof Date ? examDate : examDate ? new Date(examDate) : null
  );

  const { icon: Icon, color, bg } = variantConfig[countdown.variant];

  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-sm", color, className)}>
        <Icon className="h-4 w-4" />
        {countdown.message}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-lg p-3", bg, className)}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", bg)}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        {countdown.variant === "upcoming" && (
          <p className={cn("text-3xl font-bold leading-none", color)}>
            {countdown.daysLabel}
          </p>
        )}
        {countdown.variant === "today" && (
          <p className={cn("text-lg font-bold leading-none", color)}>Today!</p>
        )}
        {countdown.variant === "passed" && (
          <p className={cn("text-2xl font-bold leading-none", color)}>
            -{countdown.daysLabel}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">{countdown.message}</p>
      </div>
    </div>
  );
}
