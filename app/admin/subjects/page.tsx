import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen } from "lucide-react";
import { SubjectDialog } from "./_components/subject-dialog";
import { DeleteSubjectButton } from "./_components/delete-subject-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
    await requireAdmin();
    const { page } = await searchParams;
    const currentPage = Number(page) || 1;
    const pageSize = 10;
    const skip = (currentPage - 1) * pageSize;

    const [subjects, totalSubjects] = await Promise.all([
        prisma.subject.findMany({
            include: {
                _count: {
                    select: { groupClasses: true }
                }
            },
            orderBy: { name: "asc" },
            skip,
            take: pageSize,
        }),
        prisma.subject.count(),
    ]);

    const totalPages = Math.ceil(totalSubjects / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BookOpen className="h-8 w-8" />
                        Subjects
                    </h1>
                    <p className="text-muted-foreground">Manage subjects for group classes</p>
                </div>
                <div className="flex items-center gap-2">
                    <SubjectDialog />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Subjects</CardTitle>
                    <CardDescription>
                        List of all subjects available for group classes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Classes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subjects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No subjects found. Add a subject to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                subjects.map((subject) => (
                                    <TableRow key={subject.id}>
                                        <TableCell className="font-medium">
                                            {subject.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{subject.slug}</TableCell>
                                        <TableCell>
                                            <span className="font-medium">{subject._count.groupClasses}</span> classes
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <SubjectDialog subject={subject as any} />
                                                <DeleteSubjectButton id={subject.id} name={subject.name} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <Button variant="outline" size="sm" asChild disabled={currentPage <= 1}>
                                <Link 
                                    href={{
                                        pathname: "/admin/subjects",
                                        query: { page: currentPage - 1 }
                                    }} 
                                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                                >
                                    Previous
                                </Link>
                            </Button>
                            <div className="text-sm font-medium">
                                Page {currentPage} of {totalPages}
                            </div>
                            <Button variant="outline" size="sm" asChild disabled={currentPage >= totalPages}>
                                <Link 
                                    href={{
                                        pathname: "/admin/subjects",
                                        query: { page: currentPage + 1 }
                                    }} 
                                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                                >
                                    Next
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
