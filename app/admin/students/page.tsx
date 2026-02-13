import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconUserCircle, IconBook, IconTrendingUp } from "@tabler/icons-react";
import { prisma as db } from "@/lib/db";
import { MessageDialog } from "./_components/message-dialog";
import Link from "next/link";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  await requireAdmin();

  const students = await db.user.findMany({
    where: { role: 'student' },
    include: {
      enrollment: {
        include: {
          Course: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <IconUserCircle className="h-8 w-8" />
          Students Management
        </h1>
        <p className="text-muted-foreground">View and manage student accounts</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{students.filter(s => {
              const monthAgo = new Date();
              monthAgo.setMonth(monthAgo.getMonth() - 1);
              return new Date(s.createdAt) > monthAgo;
            }).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>View student accounts and enrollment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <IconBook className="h-4 w-4" />
                      {student.enrollment.length} courses enrolled
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>Active</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/students/${student.id}`}>View Details</Link>
                  </Button>
                  <MessageDialog recipientId={student.id} recipientName={student.name || "Student"} />
                </div>
              </div>
            ))}
            {students.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No students found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
