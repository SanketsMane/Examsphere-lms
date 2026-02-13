import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen } from "lucide-react";
import { SubjectDialog } from "./_components/subject-dialog";
import { DeleteSubjectButton } from "./_components/delete-subject-button";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getSubjects() {
    const subjects = await prisma.subject.findMany({
        include: {
            _count: {
                select: { groupClasses: true }
            }
        },
        orderBy: { name: "asc" }
    });
    return subjects;
}

export default async function AdminSubjectsPage() {
    await requireAdmin();

    const subjects = await getSubjects();

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
                </CardContent>
            </Card>
        </div>
    );
}
