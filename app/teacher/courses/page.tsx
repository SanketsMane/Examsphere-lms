import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Edit, MoreHorizontal, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket

export const dynamic = "force-dynamic";

export default async function TeacherCoursesPage() {
    const session = await getSessionWithRole();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        return redirect("/login");
    }

    const userCountry = (session.user as any).country || "India";

    const courses = await prisma.course.findMany({
        where: {
            userId: session.user.id
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id }
    });
    const isApproved = teacherProfile?.isApproved ?? false;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                    <p className="text-muted-foreground">Manage your courses and view their performance</p>
                </div>
                {isApproved && (
                    <Button asChild>
                        <Link href="/teacher/courses/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Course
                        </Link>
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Courses</CardTitle>
                    <CardDescription>
                        You have created {courses.length} courses
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {courses.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground mb-4">No courses found. Start creating your first course!</p>
                            {isApproved ? (
                                <Button asChild variant="outline">
                                    <Link href="/teacher/courses/create">
                                        Create Course
                                    </Link>
                                </Button>
                            ) : (
                                <p className="text-sm text-orange-600 bg-orange-50 inline-block px-3 py-1 rounded-full">
                                    Account approval required to create courses
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Mobile View: Cards */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {courses.map((course) => (
                                    <div key={course.id} className="bg-card border rounded-lg p-4 space-y-3 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold">{course.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {new Date(course.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant={course.status === "Published" ? "default" : "secondary"}>
                                                {course.status}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <span className="font-bold">{formatPriceSimple(course.price || 0, userCountry)}</span>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/teacher/courses/${course.id}/edit`}>
                                                    Edit
                                                    <Edit className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {courses.map((course) => (
                                            <TableRow key={course.id}>
                                                <TableCell className="font-medium">{course.title}</TableCell>
                                                <TableCell>{formatPriceSimple(course.price || 0, userCountry)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={course.status === "Published" ? "default" : "secondary"}>
                                                        {course.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(course.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/teacher/courses/${course.id}/edit`}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
