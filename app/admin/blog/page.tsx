import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Edit } from "lucide-react";
import Link from "next/link";
import { DeleteBlogPostButton } from "./_components/delete-blog-button";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
    await requireAdmin();

    const posts = await prisma.blogPost.findMany({
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <FileText className="h-8 w-8" />
                        Blog & Forum
                    </h1>
                    <p className="text-muted-foreground">Manage blog posts and updates.</p>
                </div>
                <Link href="/admin/blog/create">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" /> Create Post
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Posts</CardTitle>
                    <CardDescription>
                        List of all blog posts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No posts found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                posts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium max-w-[300px] truncate">
                                            {post.title}
                                        </TableCell>
                                        <TableCell>{post.author.name}</TableCell>
                                        <TableCell>
                                            {post.isPublished ? (
                                                <Badge className="bg-green-600">Published</Badge>
                                            ) : (
                                                <Badge variant="outline">Draft</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(post.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/blog/${post.id}`}>
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <DeleteBlogPostButton id={post.id} title={post.title} />
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
