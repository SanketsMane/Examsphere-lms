import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconSchool } from "@tabler/icons-react";
import { prisma as db } from "@/lib/db";
import { TeacherActions } from "./_components/teacher-actions";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  const [teachers, totalTeachers, activeCount, pendingCount] = await Promise.all([
    db.user.findMany({
      where: { role: 'teacher' },
      include: {
        teacherProfile: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    db.user.count({ where: { role: 'teacher' } }),
    db.teacherProfile.count({ where: { isApproved: true } }),
    db.teacherProfile.count({ where: { isApproved: false } }),
  ]);

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const newThisMonth = await db.user.count({
    where: {
      role: 'teacher',
      createdAt: { gte: monthAgo }
    }
  });

  const totalPages = Math.ceil(totalTeachers / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <IconSchool className="h-8 w-8" />
          Teachers Management
        </h1>
        <p className="text-muted-foreground">Manage teacher accounts and applications</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{newThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teachers</CardTitle>
          <CardDescription>View and manage teacher accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teachers.map((teacher: any) => (
              <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{teacher.name}</p>
                  <p className="text-sm text-muted-foreground">{teacher.email}</p>
                  {teacher.teacherProfile?.bio && (
                    <p className="text-sm text-muted-foreground mt-1">{teacher.teacherProfile.bio.slice(0, 100)}...</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={teacher.teacherProfile?.isApproved ? "default" : "secondary"} className={teacher.teacherProfile?.isApproved ? "bg-green-600" : "bg-orange-500"}>
                    {teacher.teacherProfile?.isApproved ? "Active" : "Pending"}
                  </Badge>
                  <TeacherActions
                    userId={teacher.id}
                    isApproved={!!teacher.teacherProfile?.isApproved}
                    isVerified={!!teacher.teacherProfile?.isVerified}
                  />
                </div>
              </div>
            ))}
            {teachers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No teachers found</p>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" asChild disabled={currentPage <= 1}>
                <Link href={currentPage <= 1 ? "#" : `/admin/teachers?page=${currentPage - 1}`} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>Previous</Link>
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button variant="outline" size="sm" asChild disabled={currentPage >= totalPages}>
                <Link href={currentPage >= totalPages ? "#" : `/admin/teachers?page=${currentPage + 1}`} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}>Next</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
