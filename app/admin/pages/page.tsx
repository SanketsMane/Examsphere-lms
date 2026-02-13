import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Edit } from "lucide-react";
import Link from "next/link";
import { DeletePageButton } from "./_components/delete-page-button";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
    await requireAdmin();

    const pages = await prisma.page.findMany({
        orderBy: { updatedAt: "desc" }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <FileText className="h-8 w-8" />
                        CMS Pages
                    </h1>
                    <p className="text-muted-foreground">Manage static content pages like About Us, Privacy Policy.</p>
                </div>
                <Link href="/admin/pages/create">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" /> Create Page
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Pages</CardTitle>
                    <CardDescription>
                        List of published and draft pages.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No pages found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pages.map((page) => (
                                    <TableRow key={page.id}>
                                        <TableCell className="font-medium">
                                            {page.title}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                                        <TableCell>
                                            {page.isPublished ? (
                                                <Badge className="bg-green-600">Published</Badge>
                                            ) : (
                                                <Badge variant="outline">Draft</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(page.updatedAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/pages/${page.id}`}>
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <DeletePageButton id={page.id} title={page.title} />
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
