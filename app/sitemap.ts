import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kidokool.com';

  let courseUrls: MetadataRoute.Sitemap = [];
  let blogUrls: MetadataRoute.Sitemap = [];

  try {
    // Fetch all public courses
    const courses = await prisma.course.findMany({
      where: { status: 'Published' },
      select: { slug: true, updatedAt: true }
    });

    courseUrls = courses.map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Fetch all public blog posts
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true }
    });

    blogUrls = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages only if database is unavailable (e.g., during build)
  }

  // Static pages
  const staticPages = [
    '',
    '/courses',
    '/teachers',
    '/blog',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.5,
  }));

  return [...staticPages, ...courseUrls, ...blogUrls];
}
