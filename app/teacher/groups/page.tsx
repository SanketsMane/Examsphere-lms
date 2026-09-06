import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // Assuming auth from lib
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { PlusCircle, Users, CheckCircle, XCircle } from "lucide-react";
import { updateEnrollmentStatus, deleteGroupClass } from "@/app/actions/groups";
import { requireTeacher } from "@/app/data/auth/require-roles";

export default async function TeacherGroupsPage() {
  await requireTeacher();
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user || (session.user as any).role !== "teacher") return <div>Unauthorized</div>;

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            // Fetch groups where teacher is owner
        }
    });

    if (!teacher) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Teacher Profile Required</h1>
                <p>Please complete your teacher profile to access group classes.</p>
                <Link href="/teacher/profile" className="text-blue-600 hover:underline mt-2 inline-block">
                    Go to Profile Settings
                </Link>
            </div>
        );
    }

    // Direct fetch for better typing if relations setup is tricky
    const groups = await prisma.groupClass.findMany({
        where: { teacherId: teacher.id },
        include: {
            enrollments: {
                include: { student: true }
            }
        },
        orderBy: { scheduledAt: "asc" }
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Group Classes</h1>
                    <p className="text-muted-foreground">Manage your group sessions, enrollments, and advertisements.</p>
                </div>
                <Link href="/teacher/groups/create">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Group
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groups.map(group => (
                    <Card key={group.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="line-clamp-1">{group.title}</CardTitle>
                                {group.isAdvertised && <Badge>Ad</Badge>}
                            </div>
                            <CardDescription>{formatDate(group.scheduledAt)}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="space-y-4">
                                <div className="text-sm text-gray-500 line-clamp-2">
                                    {group.description}
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Users className="h-4 w-4" />
                                    <span>{group.enrollments.filter(e => e.status === "Active").length} / {group.maxStudents} Students</span>
                                </div>

                                {/* Pending Requests Section */}
                                {group.enrollments.some(e => e.status === "Pending") && (
                                    <div className="bg-yellow-50 p-3 rounded-md">
                                        <h4 className="text-xs font-bold text-yellow-800 uppercase mb-2">Pending Requests</h4>
                                        <div className="space-y-2">
                                            {group.enrollments.filter(e => e.status === "Pending").map(enrollment => (
                                                <div key={enrollment.id} className="flex items-center justify-between text-sm">
                                                    <span>{enrollment.student.name}</span>
                                                    <div className="flex gap-1">
                                                        <form action={async () => {
                                                            "use server";
    await requireTeacher();
                                                            await updateEnrollmentStatus(enrollment.id, "Active");
                                                        }}>
                                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600">
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                        </form>
                                                        <form action={async () => {
                                                            "use server";
    await requireTeacher();
                                                            await updateEnrollmentStatus(enrollment.id, "Cancelled");
                                                        }}>
                                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600">
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </form>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex gap-2">
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href={`/teacher/groups/${group.id}/edit`}>Edit / Advertise</Link>
                                    </Button>
                                    {/* Future: Chat Button */}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {groups.length === 0 && (
                    <div className="col-span-full text-center p-12 text-muted-foreground border border-dashed rounded-lg">
                        No group classes found. Create one to get started!
                    </div>
                )}
            </div>
        </div>
    );
}
