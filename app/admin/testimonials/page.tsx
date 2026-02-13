import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { TestimonialDialog } from "./_components/testimonial-dialog";
import { DeleteTestimonialButton } from "./_components/delete-testimonial-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
    await requireAdmin();

    const testimonials = await prisma.testimonial.findMany({
        orderBy: { createdAt: "desc" }
    });

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
                </CardContent>
            </Card>
        </div>
    );
}
