import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconSchool, IconCheck, IconX, IconClock } from "@tabler/icons-react";
import { prisma as db } from "@/lib/db";
import { TeacherActions } from "./_components/teacher-actions";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  await requireAdmin();

  const teachers = await db.user.findMany({
    where: { role: 'teacher' },
    include: {
      teacherProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  const activeTeachers = teachers.filter((t: any) => t.teacherProfile?.isApproved);
  const pendingTeachers = teachers.filter((t: any) => !t.teacherProfile?.isApproved);

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
            <div className="text-2xl font-bold">{activeTeachers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTeachers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{teachers.filter((t: any) => {
              const monthAgo = new Date();
              monthAgo.setMonth(monthAgo.getMonth() - 1);
              return new Date(t.createdAt) > monthAgo;
            }).length}</div>
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
        </CardContent>
      </Card>
    </div>
  );
}
