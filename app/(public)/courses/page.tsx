import { getAllCourses } from "@/app/data/course/get-all-courses";
import { CourseComparisonProvider } from "@/components/marketing/CourseComparison";
import { PublicCourseCardSkeleton } from "../_components/PublicCourseCard";
import { CourseFilters } from "../_components/CourseFilters";
import { Suspense } from "react";
import {
  Code, Palette, BarChart3, TrendingUp, Target, Lightbulb
} from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { AnimatedCoursesGrid } from "@/components/marketing/AnimatedCoursesGrid";
import { getAllCategories } from "@/app/data/marketing/get-marketing-data";
import { getSessionWithRole } from "@/app/data/auth/require-roles"; // Added for localization - Author: Sanket
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Premium Courses - EXAMSPHERE",
  description: "Browse our extensive collection of expert-led courses in Programming, Design, Business, and more. Start learning today.",
};

interface SearchParams {
  category?: string;
  level?: string;
  search?: string;
  priceRange?: string | string[];
}

interface Props {
  searchParams: Promise<SearchParams>;
}

const trendingTopics = [
  "React & Next.js", "AI & Machine Learning", "Python Programming",
  "UI/UX Design", "Digital Marketing", "Data Analytics",
  "Cloud Computing", "Cybersecurity"
];

export default async function PublicCoursesRoute({ searchParams }: Props) {
  const session = await getSessionWithRole();
  const params = await searchParams;
  const allCourses = await getAllCourses();
  
  const userCountry = (session?.user as any)?.country || "India";
  const categories = await getAllCategories(); // Fetch all dynamic categories

  // Filter courses based on search parameters
  let filteredCourses = allCourses;

  if (params.search) {
    filteredCourses = filteredCourses.filter(course =>
      course.title.toLowerCase().includes(params.search!.toLowerCase()) ||
      course.smallDescription?.toLowerCase().includes(params.search!.toLowerCase())
    );
  }

  if (params.category) {
    const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
    if (categoryParam) {
      filteredCourses = filteredCourses.filter(course =>
        course.category?.toLowerCase() === categoryParam.toLowerCase()
      );
    }
  }

  if (params.level) {
    // Handle array or string for level
    const levels = Array.isArray(params.level) ? params.level : [params.level];
    filteredCourses = filteredCourses.filter(course =>
      levels.some(l => l?.toLowerCase() === course.level?.toLowerCase())
    );
  }

  if (params.priceRange) {
    const ranges = Array.isArray(params.priceRange) ? params.priceRange : [params.priceRange];

    filteredCourses = filteredCourses.filter(course => {
      const price = course.price || 0;
      return ranges.some(range => {
        if (range === 'free') return price === 0;
        if (range === 'under-1000') return price < 1000;
        if (range === '1000-5000') return price >= 1000 && price <= 5000;
        if (range === '5000-10000') return price >= 5000 && price <= 10000;
        if (range === 'over-10000') return price > 10000;
        return false;
      });
    });
  }

  return (
    <CourseComparisonProvider>
      <div className="min-h-screen bg-background font-sans text-foreground">
        {/* Clean Hero Section */}
        <section className="relative overflow-hidden bg-white dark:bg-black py-20 lg:py-28 border-b border-gray-100 dark:border-gray-800">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <FadeIn>
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6 text-[#011E21] dark:text-white">
                Explore Premium <span className="text-primary">Courses</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Unlock your potential with our extensive library of expert-led courses. From coding to design, find the perfect path for your career.
              </p>

              {/* Trending Tags */}
              <div className="flex flex-wrap justify-center gap-2 items-center">
                <span className="text-sm font-semibold text-foreground mr-2">Trending:</span>
                {trendingTopics.slice(0, 5).map((topic, index) => (
                  <Link
                    key={index}
                    href={`/courses?search=${encodeURIComponent(topic)}`}
                    className="px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 hover:border-primary text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-all"
                  >
                    {topic}
                  </Link>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Main Content: Filters & Grid */}
        <section className="py-20 container mx-auto px-4">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-[#011E21] dark:text-white">Browse Collection</h2>
                <p className="text-muted-foreground mt-1">Showing {filteredCourses.length} results</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
              {/* Sidebar Filters */}
              <aside className="lg:sticky lg:top-24 h-fit">
                <Suspense fallback={<div className="h-[500px] w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />}>
                  <CourseFilters categories={categories} />
                </Suspense>
              </aside>

              {/* Course Grid */}
              <div className="flex-1">
                <Suspense fallback={
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <PublicCourseCardSkeleton key={i} />
                    ))}
                  </div>
                }>
                  <AnimatedCoursesGrid courses={filteredCourses} userCountry={userCountry} />
                </Suspense>
              </div>
            </div>
          </div>
        </section>
      </div>
    </CourseComparisonProvider>
  );
}