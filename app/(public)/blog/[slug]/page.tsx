import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Eye,
  User,
  ArrowLeft,
} from "lucide-react";
import { getBlogPostBySlug, getFeaturedBlogPosts } from "@/app/actions/blog";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  // getBlogPostBySlug doesn't filter drafts, so unpublished posts must 404 here.
  if (!post || !post.isPublished) {
    notFound();
  }

  const readingTime = Math.ceil(post.content.split(" ").length / 200);
  const relatedPosts = await getFeaturedBlogPosts(4);

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post Header */}
        <header className="mb-8">
          {/* Category */}
          {post.category && (
            <Badge
              variant="secondary"
              className="mb-4"
              style={{
                backgroundColor: post.category.color || "#e5e7eb",
                color: "#374151"
              }}
            >
              {post.category.name}
            </Badge>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.publishedAt!), "MMMM dd, yyyy")}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {readingTime} min read
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {post.views.toLocaleString()} views
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author.image || ""} />
                <AvatarFallback>
                  {post.author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{post.author.name}</div>
                {post.author.teacherProfile && (
                  <div className="text-sm text-muted-foreground">
                    Mentor • {((post.author.teacherProfile.expertise as string[] | null) ?? []).slice(0, 2).join(", ")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="mt-6" />
        </header>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="aspect-video relative overflow-hidden rounded-lg mb-8">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Post Content */}
        <div
          className="prose prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="text-sm font-medium text-muted-foreground mr-2">Tags:</span>
            {post.tags.map((tag: any) => (
              <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                <Badge
                  variant="outline"
                  className="hover:bg-muted cursor-pointer"
                  style={{ color: tag.color || "#6b7280" }}
                >
                  #{tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        <Separator className="mb-8" />

        {/* Author Bio */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={post.author.image || ""} />
                <AvatarFallback className="text-lg">
                  {post.author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">About {post.author.name}</h3>
                {post.author.teacherProfile?.bio && (
                  <p className="text-muted-foreground mb-3">
                    {post.author.teacherProfile.bio}
                  </p>
                )}
                {post.author.teacherProfile?.expertise && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Expertise:</span>
                    {((post.author.teacherProfile.expertise as string[] | null) ?? []).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl font-bold mb-8 text-center">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedPosts.filter((p: any) => p.id !== post.id).slice(0, 3).map((relatedPost: any) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    {relatedPost.featuredImage && (
                      <div className="aspect-video relative overflow-hidden rounded-t-lg">
                        <Image
                          src={relatedPost.featuredImage}
                          alt={relatedPost.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      {relatedPost.category && (
                        <Badge
                          variant="secondary"
                          className="w-fit mb-2"
                          style={{
                            backgroundColor: relatedPost.category.color || "#e5e7eb",
                            color: "#374151"
                          }}
                        >
                          {relatedPost.category.name}
                        </Badge>
                      )}
                      <CardTitle className="text-lg line-clamp-2">
                        {relatedPost.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {relatedPost.author.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {relatedPost.views}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}