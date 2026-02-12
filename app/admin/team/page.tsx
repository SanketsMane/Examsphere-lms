import { requireAdmin } from "../../data/admin/require-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  IconUsers,
  IconUserPlus,
  IconMail,
  IconPhone,
  IconCalendar,
  IconEdit,
  IconTrash,
  IconShield,
  IconBook,
  IconStar,
  IconCheck
} from "@tabler/icons-react";
import { prisma } from "@/lib/db";
import { TeacherActions } from "./_components/TeacherActions";
import { constructS3Url } from "@/lib/s3-utils";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { getSessionWithRole } from "@/app/data/auth/require-roles"; // Added for localization - Author: Sanket

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  await requireAdmin();
  const session = await getSessionWithRole();
  const userCountry = (session?.user as any)?.country || "India";

  // Fetch real team members (Admins and Teachers)
  const teamMembers = await prisma.user.findMany({
    where: {
      role: {
        in: ["admin", "teacher"]
      }
    },
    include: {
      teacherProfile: true, // Join teacher profile
      _count: {
        select: { enrollment: true } 
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const roleColors = {
    admin: "bg-red-100 text-red-800",
    teacher: "bg-blue-100 text-blue-800",
    student: "bg-gray-100 text-gray-800", // Fallback
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members, roles, and permissions
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <IconUserPlus className="h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Teachers</CardTitle>
            <IconShield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => (m as any).teacherProfile?.isVerified).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <IconBook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.role === "teacher" && (m as any).teacherProfile?.isVerified === false).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Team Members</h2>
        <div className="grid gap-4">
          {teamMembers.map((member) => {
            const profile = member.teacherProfile; // Assuming 1-1 or 1-many
            const isVerified = profile?.isVerified;

            return (
              <Card key={member.id} className={!isVerified && member.role === "teacher" ? "border-yellow-400 bg-yellow-50/50" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={constructS3Url(member.image || "")} alt={member.name || "User"} />
                        <AvatarFallback>
                          {member.name?.split(" ").map(n => n[0]).join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {member.name}
                          <Badge
                            variant="secondary"
                            className={roleColors[(member.role as keyof typeof roleColors) || "student"] || roleColors.student}
                          >
                            {(member.role || "user").toUpperCase()}
                          </Badge>
                          {isVerified && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">Verified</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <IconMail className="h-3 w-3" />
                            {member.email}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div>
                      {member.role === "teacher" && !isVerified && profile ? (
                        <TeacherActions profileId={profile.id} userId={member.id} />
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <IconEdit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {profile && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                      <div>
                        <strong>Expertise:</strong> {profile.expertise.join(", ")}
                      </div>
                      <div>
                        <strong>Rate:</strong> {formatPriceSimple(profile.hourlyRate ? profile.hourlyRate / 100 : 0, userCountry)}/hr
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {profile.bio}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}