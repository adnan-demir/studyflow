"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  FileText,
  Brain,
  FileIcon,
  Target,
  Mic,
  GraduationCap,
  PlusCircle,
  LogOut,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getExamCountdown } from "@/lib/utils";
import { useState } from "react";

interface CourseNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  todo?: boolean;
}

const COURSE_NAV_ITEMS: CourseNavItem[] = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "AI Chat", href: "/chat", icon: MessageSquare },
  { label: "Summaries", href: "/summaries", icon: FileText },
  { label: "PDF Notes", href: "/notes", icon: FileIcon },
  { label: "Quizzes", href: "/quizzes", icon: Brain, todo: true },
  { label: "Weak Topics", href: "/weak-topics", icon: Target, todo: true },
  { label: "Voice Mode", href: "/voice", icon: Mic, todo: true },
  { label: "Exam Simulation", href: "/exam-simulation", icon: GraduationCap, todo: true },
];

interface SidebarCourse {
  id: string;
  name: string;
  exam: { examDate: string } | null;
}

interface SidebarUser {
  name: string | null;
  email: string;
  image: string | null;
}

interface SidebarClientProps {
  courses: SidebarCourse[];
  user: SidebarUser;
}

function CourseSidebarItem({ course }: { course: SidebarCourse }) {
  const pathname = usePathname();
  const basePath = `/courses/${course.id}`;
  const isActive = pathname.startsWith(basePath);
  const [open, setOpen] = useState(isActive);

  const countdown = getExamCountdown(
    course.exam ? new Date(course.exam.examDate) : null
  );

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-white/10 text-white"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        )}
      >
        <BookOpen className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-left font-medium">
          {course.name}
        </span>
        {countdown.variant === "upcoming" && (
          <Badge
            variant="outline"
            className="shrink-0 border-indigo-400/30 bg-indigo-500/10 px-1.5 py-0 text-[10px] text-indigo-300"
          >
            {countdown.daysLabel}d
          </Badge>
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="ml-3 mt-1 border-l border-slate-700 pl-3">
          {COURSE_NAV_ITEMS.map((item) => {
            const href = `${basePath}${item.href}`;
            const isItemActive =
              item.href === ""
                ? pathname === basePath
                : pathname.startsWith(href);

            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                  isItemActive
                    ? "bg-indigo-600/20 text-indigo-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.todo && (
                  <span className="rounded bg-slate-700 px-1 py-0.5 text-[9px] text-slate-400">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SidebarClient({ courses, user }: SidebarClientProps) {
  const pathname = usePathname();

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-slate-700/50 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="text-base font-bold text-white">StudyFlow AI</span>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Dashboard link */}
        <Link
          href="/dashboard"
          className={cn(
            "mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/dashboard"
              ? "bg-white/10 text-white"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <div className="mb-2 flex items-center justify-between px-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Courses
          </span>
          <Link href="/courses/new">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-slate-400 hover:text-white"
              title="New Course"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-slate-500">No courses yet.</p>
            <Link href="/courses/new">
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-xs text-indigo-400 hover:text-indigo-300"
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Create your first course
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            {courses.map((course) => (
              <CourseSidebarItem key={course.id} course={course} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-slate-700/50 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="bg-indigo-600 text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {user.name ?? user.email}
            </p>
            {user.name && (
              <p className="truncate text-[10px] text-slate-400">{user.email}</p>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
