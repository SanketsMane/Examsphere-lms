import { BlogForm } from "../_components/blog-form";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/data/auth/require-roles";

export default async function AdminEditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
        where: { id }
    });

    if (!post) notFound();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8" />
                    Edit Post: {post.title}
                </h1>
                <p className="text-muted-foreground">Update blog post content.</p>
            </div>
            <BlogForm post={post} />
        </div>
    );
}
