import { requireTeacher } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { TeacherSidebarLayout } from "./_components/teacher-sidebar-layout";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const session = await requireTeacher();

  // Admins browsing the teacher area get the full navigation.
  let isApproved = session.user.role === "admin";
  if (!isApproved) {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { isApproved: true },
    });
    isApproved = !!profile?.isApproved;
  }

  return (
    <TeacherSidebarLayout isApproved={isApproved}>
      {children}
    </TeacherSidebarLayout>
  );
}
