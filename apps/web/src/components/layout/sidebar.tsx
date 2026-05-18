import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarClient } from "./sidebar-client";

export async function Sidebar() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const courses = await prisma.course.findMany({
    where: { userId: session.user.id },
    include: { exam: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <SidebarClient
      courses={courses.map((c) => ({
        id: c.id,
        name: c.name,
        exam: c.exam ? { examDate: c.exam.examDate.toISOString() } : null,
      }))}
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? "",
        image: session.user.image ?? null,
      }}
    />
  );
}
