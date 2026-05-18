import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, startOfDay } from "date-fns";
import type { ExamCountdownResult } from "@studyflow/shared/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getExamCountdown(examDate: Date | null | undefined): ExamCountdownResult {
  if (!examDate) {
    return {
      variant: "none",
      daysLabel: "",
      message: "No exam date set",
    };
  }

  const today = startOfDay(new Date());
  const exam = startOfDay(new Date(examDate));
  const days = differenceInDays(exam, today);

  if (days === 0) {
    return { variant: "today", daysLabel: "Today", message: "Exam is today!" };
  }
  if (days > 0) {
    return {
      variant: "upcoming",
      daysLabel: days.toString(),
      message: `Exam in ${days} day${days === 1 ? "" : "s"}`,
    };
  }

  const absDays = Math.abs(days);
  return {
    variant: "passed",
    daysLabel: absDays.toString(),
    message: `Exam passed ${absDays} day${absDays === 1 ? "" : "s"} ago`,
  };
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}
