import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconSchool, IconMail, IconPhone, IconMapPin, IconCalendar, IconBook } from "@tabler/icons-react";
import { TeacherActions } from "../_components/teacher-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function TeacherDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();
    const { id } = await params;

    const teacher = await prisma.user.findUnique({
        where: { id },
        include: {
            teacherProfile: true,
            courses: {
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { enrollment: true }
                    }
                }
            }
        }
    });

    if (!teacher || teacher.role !== "teacher") {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin/teachers" className="text-muted-foreground hover:text-foreground text-sm mb-2 block">
                        &larr; Back to Teachers
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <IconSchool className="h-8 w-8" />
                        Teacher Details
                    </h1>
                    <p className="text-muted-foreground">Manage profile and courses for {teacher.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={teacher.teacherProfile?.isApproved ? "default" : "secondary"} className={teacher.teacherProfile?.isApproved ? "bg-green-600 font-medium text-md px-3 py-1" : "bg-orange-500 font-medium text-md px-3 py-1"}>
                        {teacher.teacherProfile?.isApproved ? "Active Account" : "Approval Pending"}
                    </Badge>
                    <TeacherActions
                        userId={teacher.id}
                        isApproved={!!teacher.teacherProfile?.isApproved}
                        isVerified={!!teacher.teacherProfile?.isVerified}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="h-32 w-32 mb-4">
                                <AvatarImage src={teacher.image || ""} />
                                <AvatarFallback className="text-4xl">{teacher.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CardTitle>{teacher.name}</CardTitle>
                            <CardDescription>{teacher.teacherProfile?.bio ? (teacher.teacherProfile.bio.length > 50 ? teacher.teacherProfile.bio.substring(0, 50) + "..." : teacher.teacherProfile.bio) : "No bio"}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <IconMail className="h-4 w-4" />
                                <span>{teacher.email}</span>
                            </div>

                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Qualifications</h4>
                            <p className="text-sm text-muted-foreground">
                                {teacher.teacherProfile?.experience ? `${teacher.teacherProfile.experience} years of experience` : "No experience listed"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Content & Courses */}
                <div className="md:col-span-2 space-y-6">
                    {/* Bio */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Biography</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                {teacher.teacherProfile?.bio || "No biography info provided."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Courses */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <IconBook className="h-5 w-5" />
                                Created Courses ({teacher.courses.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {teacher.courses.length > 0 ? (
                                    teacher.courses.map(course => (
                                        <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{course.title}</p>
                                                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                                    <Badge variant="outline">{course.status === "Published" ? "Published" : "Draft"}</Badge>
                                                    <span>${course.price}</span>
                                                    <span>{course._count.enrollment} students</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/courses/${course.slug}`}>View</Link>
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-4">No courses created yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
