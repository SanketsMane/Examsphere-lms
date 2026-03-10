import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { TestimonialDialog } from "./_components/testimonial-dialog";
import { DeleteTestimonialButton } from "./_components/delete-testimonial-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    await requireAdmin();
    const { page } = await searchParams;
    const currentPage = Number(page) || 1;
    const pageSize = 10;
    const skip = (currentPage - 1) * pageSize;

    const [testimonials, totalTestimonials] = await Promise.all([
        prisma.testimonial.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
        }),
        prisma.testimonial.count(),
    ]);

    const totalPages = Math.ceil(totalTestimonials / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Users className="h-8 w-8" />
                        Testimonials
                    </h1>
                    <p className="text-muted-foreground">Manage student and parent reviews.</p>
                </div>
                <TestimonialDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Testimonials</CardTitle>
                    <CardDescription>
                        List of testimonials displayed on the site.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Content</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {testimonials.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No testimonials yet. Add one!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                testimonials.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={t.image || ""} />
                                                    <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                {t.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{t.role}</TableCell>
                                        <TableCell className="max-w-xs truncate text-muted-foreground">
                                            {t.content}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {t.isActive ? <Badge className="bg-green-600">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                                                {t.isFeatured && <Badge variant="secondary">Featured</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <TestimonialDialog testimonial={t} />
                                                <DeleteTestimonialButton id={t.id} name={t.name} />
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
                                        pathname: "/admin/testimonials",
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
                                        pathname: "/admin/testimonials",
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
