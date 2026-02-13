"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/action-security";

export type ActionState = {
  success?: boolean;
  error?: string;
  timestamp?: number;
};


export async function createBlogPost(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireAdmin();

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const excerpt = formData.get("excerpt") as string;
    const isPublished = formData.get("isPublished") === "on";
    const coverImage = formData.get("coverImage") as string;
    let slug = formData.get("slug") as string;

    if (!title) return { error: "Title is required" };

    if (!slug) {
      slug = slugify(title, { lower: true, strict: true });
    }

    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) return { error: "Post with this slug already exists" };

    await prisma.blogPost.create({
      data: {
        title,
        slug,
        content: content || "",
        excerpt,
        featuredImage: coverImage,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        authorId: (user.user as any).id,
      },
    });

    revalidatePath("/admin/blog");
    return { success: true, timestamp: Date.now() };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateBlogPost(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();

    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const excerpt = formData.get("excerpt") as string;
    const isPublished = formData.get("isPublished") === "on";
    const coverImage = formData.get("coverImage") as string;
    const slug = formData.get("slug") as string;

    if (!id || !title) return { error: "ID and Title are required" };

    const existing = await prisma.blogPost.findFirst({
      where: { slug, NOT: { id } }
    });
    if (existing) return { error: "Post with this slug already exists" };

    await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        excerpt,
        featuredImage: coverImage,
        isPublished,
        publishedAt: isPublished ? (new Date()) : null,
      },
    });

    revalidatePath("/admin/blog");
    return { success: true, timestamp: Date.now() };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteBlogPost(id: string) {
  try {
    await requireAdmin();
    await prisma.blogPost.delete({ where: { id } });
    revalidatePath("/admin/blog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Public Data Fetching Actions

export async function getBlogPosts(
  page: number = 1,
  limit: number = 10,
  category?: string,
  tag?: string
) {
  const skip = (page - 1) * limit;

  const where: Prisma.BlogPostWhereInput = {
    isPublished: true,
    ...(category && { category: { slug: category } }),
    ...(tag && { tags: { some: { slug: tag } } }),
  };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        category: true,
        tags: true,
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, total, totalPages: Math.ceil(total / limit) };
}

export async function getBlogPostBySlug(slug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          teacherProfile: {
            select: {
              expertise: true,
              bio: true
            }
          }
        }
      },
      category: true,
      tags: true,
    },
  });

  if (post) {
    // access the property to ensure it exists for client serialization if needed, 
    // though server components can handle dates.
    // Increment views (optional, fire and forget)
    // prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {});
    // Better to do this in a separate interaction or useEffect to avoid server mutation on GET but valid for RSC sometimes.
  }

  return post;
}

export async function getFeaturedBlogPosts(limit: number = 3) {
  // For now, just return latest published posts
  return prisma.blogPost.findMany({
    where: { isPublished: true },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: true
    },
    orderBy: { views: 'desc' }, // or publishedAt
    take: limit
  });
}