import { requireUser } from "@/app/data/user/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IconUsers, IconSearch, IconUserPlus, IconShield, IconSchool, IconUser } from "@tabler/icons-react";
import { prisma as db } from "@/lib/db";
import { UserActions } from "./_components/user-actions";
import { AddUserDialog } from "./_components/add-user-dialog";
import { BulkImportDialog } from "./_components/bulk-import-dialog";
import { BulkExportDialog } from "./_components/bulk-export-dialog";

export const dynamic = "force-dynamic";

export default async function UsersManagementPage() {
  await requireUser();

  const users = await db.user.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: await db.user.count(),
    admins: await db.user.count({ where: { role: 'admin' } }),
    teachers: await db.user.count({ where: { role: 'teacher' } }),
    students: await db.user.count({ where: { role: 'student' } }),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <IconUsers className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <div className="flex gap-2">
          <BulkImportDialog />
          <BulkExportDialog />
          <AddUserDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teachers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Search users..." className="w-64" />
              <Button variant="outline" size="icon">
                <IconSearch className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.role === 'admin' && <IconShield className="h-5 w-5" />}
                    {user.role === 'teacher' && <IconSchool className="h-5 w-5" />}
                    {user.role === 'student' && <IconUser className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user.banned ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : (
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'teacher' ? 'secondary' : 'outline'}>
                      {user.role || 'user'}
                    </Badge>
                  )}
                  <UserActions user={{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    banned: user.banned
                  }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
