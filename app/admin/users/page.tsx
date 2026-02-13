import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket
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

import { UserFilters } from "./_components/user-filters";

export const dynamic = "force-dynamic";

export default async function UsersManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; search?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const role = params.role;
  const search = params.search;

  const users = await db.user.findMany({
    where: {
      AND: [
        role ? { role } : {},
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        } : {},
      ]
    },
    take: 50,
    include: {
      teacherProfile: true,
    },
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </div>
            <div className="flex-1 max-w-2xl">
              <UserFilters />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length > 0 ? users.map((user: any) => (
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
                    banned: user.banned,
                    bio: user.bio,
                    teacherProfile: user.teacherProfile
                  }} />
                </div>
              </div>
            )) : (
              <div className="text-center py-10 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No users found matching your filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
