import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { getBlogPosts } from "@/app/actions/blog";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | ExamSphere",
  description: "Study tips and exam updates for JEE, NEET, Foundation (Class 6–10) and MBBS students from ExamSphere.",
};

const PAGE_SIZE = 12;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { posts, totalPages } = await getBlogPosts(page, PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-20 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">ExamSphere Blog</h1>
          <p className="text-lg text-muted-foreground">
            Study tips, exam updates and preparation advice for JEE, NEET, Foundation (Class 6–10)
            and MBBS students.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Articles coming soon</h2>
            <p className="text-muted-foreground mb-6">
              We&apos;re writing our first articles. Meanwhile, explore our programmes and courses.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/programs">View programmes</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const readingTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));
                const date = post.publishedAt ?? post.createdAt;

                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
                  >
                    {post.featuredImage && (
                      // Featured images are arbitrary URLs entered by admins, so skip next/image's host allow-list.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="aspect-video w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      {post.category && (
                        <Badge variant="secondary" className="w-fit">
                          {post.category.name}
                        </Badge>
                      )}
                      <h2 className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                      )}
                      <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(date, "d MMM yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {readingTime} min read
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Blog pages" className="mt-10 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Button variant="outline" asChild>
                    <Link href={`/blog?page=${page - 1}`}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Newer
                    </Link>
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Button variant="outline" asChild>
                    <Link href={`/blog?page=${page + 1}`}>
                      Older
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
