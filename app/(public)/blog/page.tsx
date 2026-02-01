import { Suspense } from "react";
import Link from "next/link";
// Duplicate Link removed
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar, Clock, Eye, User, BookOpen, TrendingUp, Search, Filter,
  ArrowRight, PenTool,
  Code, Palette, BarChart3, Zap, Target
} from "lucide-react";
import { getBlogPosts, getFeaturedBlogPosts } from "@/app/actions/blog";
import { formatDistanceToNow, format } from "date-fns";

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    tag?: string;
    search?: string;
  }>;
}

const blogStats = [
  { icon: BookOpen, label: "Articles Published", value: "2,500+", color: "#3b82f6" },
  { icon: User, label: "Expert Authors", value: "150+", color: "#10b981" },
  { icon: Eye, label: "Monthly Readers", value: "500K+", color: "#8b5cf6" },
  { icon: TrendingUp, label: "Topics Covered", value: "50+", color: "#f59e0b" }
];

const featuredTopics = [
  { name: "Web Development", icon: Code, count: 245, color: "from-blue-500 to-cyan-500", popular: true },
  { name: "UI/UX Design", icon: Palette, count: 189, color: "from-purple-500 to-pink-500", popular: true },
  { name: "Data Science", icon: BarChart3, count: 156, color: "from-green-500 to-emerald-500", popular: false },
  { name: "Digital Marketing", icon: TrendingUp, count: 134, color: "from-orange-500 to-red-500", popular: false },
  { name: "AI & Machine Learning", icon: Zap, count: 98, color: "from-indigo-500 to-purple-500", popular: true },
  { name: "Career Growth", icon: Target, count: 87, color: "from-yellow-500 to-orange-500", popular: false }
];

const trendingPosts = [
  {
    id: 1,
    title: "The Complete Guide to React 18 and Next.js 14",
    excerpt: "Learn the latest features and best practices for building modern web applications",
    category: "Web Development",
    author: "Sarah Johnson",
    readTime: "12 min read",
    publishedAt: "2 days ago",
    views: "15.2K",
    featured: true
  },
  {
    id: 2,
    title: "10 Essential UI/UX Design Principles for 2025",
    excerpt: "Master the fundamental design principles that create exceptional user experiences",
    category: "Design",
    author: "Michael Chen",
    readTime: "8 min read",
    publishedAt: "1 week ago",
    views: "8.9K",
    featured: false
  },
  {
    id: 3,
    title: "Building Your First Machine Learning Model",
    excerpt: "A beginner-friendly introduction to ML with practical Python examples",
    category: "AI & ML",
    author: "Dr. Emily Rodriguez",
    readTime: "15 min read",
    publishedAt: "3 days ago",
    views: "12.1K",
    featured: true
  }
];

const recentPosts = [
  {
    title: "Advanced Python Techniques Every Developer Should Know",
    category: "Programming",
    readTime: "10 min",
    publishedAt: "1 day ago"
  },
  {
    title: "The Future of Remote Work in Tech",
    category: "Career",
    readTime: "6 min",
    publishedAt: "2 days ago"
  },
  {
    title: "Mastering CSS Grid and Flexbox",
    category: "Web Development",
    readTime: "14 min",
    publishedAt: "3 days ago"
  },
  {
    title: "Digital Marketing Trends for 2025",
    category: "Marketing",
    readTime: "9 min",
    publishedAt: "5 days ago"
  }
];

export const dynamic = "force-dynamic";

export default async function BlogPage({ searchParams }: BlogPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-16 md:py-24">
        {/* Floating Elements */}
        <div className="absolute top-[20%] left-[15%] w-24 h-24 bg-white/10 rounded-full animate-float blur-xl" />
        <div className="absolute bottom-[25%] right-[10%] w-32 h-32 bg-white/10 rounded-full animate-float-reverse blur-xl" />

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium mb-6">
            <PenTool className="w-4 h-4" />
            Knowledge Hub
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Learn from
            <br />
            <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
              Expert Insights
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover the latest trends, tutorials, and insights from industry experts.
            Stay ahead with actionable knowledge and practical tips.
          </p>

          {/* Search Bar */}
          <div className="max-w-lg mx-auto relative group">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:bg-white/30 transition-all duration-300" />
            <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1.5 focus-within:bg-white/20 transition-all duration-300">
              <Search className="w-5 h-5 text-white/70 ml-4 mr-3" />
              <input
                type="text"
                placeholder="Search articles, topics, authors..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/60 text-base py-2"
              />
              <Button size="lg" className="rounded-full bg-white text-indigo-600 hover:bg-white/90 font-semibold px-6">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-white dark:bg-card border-b dark:border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {blogStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="p-6 bg-gray-50 dark:bg-muted/50 rounded-2xl border border-gray-100 dark:border-border hover:shadow-lg transition-all duration-300">
                <Icon className="w-10 h-10 mx-auto mb-4" style={{ color: stat.color }} />
                <div className="text-3xl font-bold text-gray-900 dark:text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Topics */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-foreground mb-4">
              Explore Topics
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Browse articles by category and discover content tailored to your interests.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTopics.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <Link
                  key={index}
                  href={`/blog?category=${encodeURIComponent(topic.name)}`}
                  className={`
                    group relative block p-8 bg-white dark:bg-card rounded-2xl transition-all duration-300
                    ${topic.popular 
                      ? 'border-2 border-indigo-500 shadow-indigo-100 dark:shadow-none' 
                      : 'border border-gray-200 dark:border-border hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow-md'}
                  `}
                >
                  {topic.popular && (
                    <span className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                      Popular
                    </span>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${topic.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-foreground mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {topic.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {topic.count} articles
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Read Articles
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16 px-4 bg-white dark:bg-card border-y dark:border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-foreground mb-2">
                Featured Articles
              </h2>
              <p className="text-lg text-muted-foreground">
                Hand-picked articles from our top contributors
              </p>
            </div>
            <Link href="/blog/all">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                View All Articles
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingPosts.map((post, index) => (
              <article key={index} className="group flex flex-col bg-gray-50 dark:bg-muted/30 rounded-3xl overflow-hidden border border-gray-100 dark:border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="relative h-56 bg-gray-200 dark:bg-muted flex items-center justify-center overflow-hidden">
                  {post.featured && (
                    <span className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-sm">
                      Featured
                    </span>
                  )}
                  <BookOpen className="w-16 h-16 text-gray-400 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="flex-1 p-8 flex flex-col">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase tracking-wide">
                      {post.category}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <Link href={`/blog/${post.id}`} className="hover:underline decoration-2 underline-offset-4 decoration-transparent hover:decoration-indigo-600">
                      {post.title}
                    </Link>
                  </h3>

                  <p className="text-muted-foreground mb-6 line-clamp-2 flex-1">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-6 border-t dark:border-border mt-auto">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{post.author}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="font-semibold">{post.views}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Posts Sidebar Layout */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-8 flex items-center gap-3">
              <span className="w-2 h-8 bg-indigo-600 rounded-full" />
              Latest Articles
            </h2>

            <Suspense fallback={<BlogPostsSkeleton />}>
              <BlogPostsList searchParams={searchParams} />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="p-8 bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border sticky top-24 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-foreground mb-6 pb-4 border-b dark:border-border">
                Recent Posts
              </h3>

              <div className="space-y-6">
                {recentPosts.map((post, index) => (
                  <div key={index} className="group">
                    <h4 className="font-bold text-gray-900 dark:text-foreground mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                      <Link href={`/blog/${index + 1}`}>
                        {post.title}
                      </Link>
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full font-medium text-gray-600 dark:text-gray-400">
                        {post.category}
                      </span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                      <span>•</span>
                      <span>{post.publishedAt}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t dark:border-border">
                <h4 className="font-bold text-gray-900 dark:text-foreground mb-4">
                  Popular Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['React', 'JavaScript', 'Python', 'Design', 'AI', 'Career', 'Tutorial', 'Tips'].map((tag, index) => (
                    <Link
                      key={index}
                      href={`/blog?tag=${tag}`}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 dark:bg-gray-800 dark:hover:bg-indigo-900/30 text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 text-xs font-semibold rounded-full transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 bg-gray-900 dark:bg-black text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 to-transparent" />
        
        <div className="relative max-w-2xl mx-auto z-10">
          <Badge variant="outline" className="mb-6 border-indigo-500/50 text-indigo-300 bg-indigo-950/30 px-4 py-1.5">
            Stay in the loop
          </Badge>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Level Up Your Skills
          </h2>
          <p className="text-lg text-gray-300 mb-10 leading-relaxed max-w-lg mx-auto">
            Get the latest articles, tutorials, and industry insights delivered straight to your inbox. No spam, just value.
          </p>

          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email address"
              className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-indigo-500 rounded-xl"
            />
            <Button size="lg" className="h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-900/20">
              Subscribe
            </Button>
          </form>

          <p className="text-xs text-gray-500 mt-6">
            By subscribing, you agree to our terms. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}

function BlogPostsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="p-6 bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border">
          <Skeleton className="w-full h-48 rounded-xl mb-6" />
          <Skeleton className="w-2/3 h-6 mb-4" />
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-4/5 h-4" />
        </div>
      ))}
    </div>
  );
}

async function BlogPostsList({ searchParams }: { searchParams: BlogPageProps['searchParams'] }) {
  const params = await searchParams;
  const result = await getBlogPosts(
    parseInt(params.page || '1'),
    10,
    params.category,
    params.tag
  );

  if (!result || !result.posts || result.posts.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: '#6b7280'
      }}>
        <BookOpen style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem auto', color: '#d1d5db' }} />
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
          No articles found
        </h3>
        <p>Try adjusting your search or browse by category.</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem'
    }}>
      {result.posts.map((post: any) => (
        <article key={post.id} style={{
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            backgroundColor: '#ddd6fe',
            color: '#5b21b6',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            {post.category?.name || 'General'}
          </div>

          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem',
            lineHeight: '1.4'
          }}>
            <Link
              href={`/blog/${post.slug || post.id}`}
              style={{
                color: 'inherit',
                textDecoration: 'none'
              }}
            >
              {post.title}
            </Link>
          </h3>

          <p style={{
            color: '#6b7280',
            lineHeight: '1.6',
            marginBottom: '1.5rem'
          }}>
            {post.excerpt || post.content?.substring(0, 150) + '...'}
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.9rem',
            color: '#6b7280'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar style={{ width: '1rem', height: '1rem' }} />
              <span>{formatDistanceToNow(new Date(post.publishedAt || post.createdAt), { addSuffix: true })}</span>
            </div>
            <Link
              href={`/blog/${post.slug || post.id}`}
              style={{
                color: '#6366f1',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Read More →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
