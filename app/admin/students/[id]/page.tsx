import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconUser, IconMail, IconBook, IconCalendar } from "@tabler/icons-react";
import { MessageDialog } from "../_components/message-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();
    const { id } = await params;

    const student = await prisma.user.findUnique({
        where: { id },
        include: {
            enrollment: {
                include: {
                    Course: true,
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!student || student.role !== "student") {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin/students" className="text-muted-foreground hover:text-foreground text-sm mb-2 block">
                        &larr; Back to Students
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <IconUser className="h-8 w-8" />
                        Student Details
                    </h1>
                    <p className="text-muted-foreground">Manage account and enrollments for {student.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    <MessageDialog recipientId={student.id} recipientName={student.name || "Student"} />
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="h-32 w-32 mb-4">
                                <AvatarImage src={student.image || ""} />
                                <AvatarFallback className="text-4xl">{student.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CardTitle>{student.name}</CardTitle>
                            <Badge variant="outline" className="mt-2">Student</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <IconMail className="h-4 w-4" />
                                <span>{student.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <IconCalendar className="h-4 w-4" />
                                <span>Joined {format(new Date(student.createdAt), "MMM d, yyyy")}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Enrollments */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <IconBook className="h-5 w-5" />
                                Enrolled Courses ({student.enrollment.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Course</TableHead>
                                        <TableHead>Enrolled On</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {student.enrollment.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                No enrollments found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        student.enrollment.map((enrollment) => (
                                            <TableRow key={enrollment.id}>
                                                <TableCell className="font-medium">{enrollment.Course.title}</TableCell>
                                                <TableCell>{format(new Date(enrollment.createdAt), "MMM d, yyyy")}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">Enrolled</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
