import Link from "next/link";
import { getAllCourses } from "@/app/data/course/get-all-courses";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { AnimatedCoursesGrid } from "@/components/marketing/AnimatedCoursesGrid";
import { PageHeader } from "@/components/dashboard/es/dashboard-kit";
import { PROGRAM_CATEGORY_NAMES } from "@/lib/examsphere-taxonomy";

export const dynamic = "force-dynamic";

/**
 * Browse Courses inside the Student Portal: every published ExamSphere course, filterable by
 * programme. Enrolled courses are marked on their card; My Courses lists only those (BUG-0005).
 */
export default async function BrowseCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const session = await getSessionWithRole();
  const allCourses = await getAllCourses();

  const active = category && PROGRAM_CATEGORY_NAMES.includes(category as never) ? category : null;
  const courses = active
    ? allCourses.filter((c) => c.category?.toLowerCase() === active.toLowerCase())
    : allCourses;

  const chip = (selected: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
      selected
        ? "border-navy-900 bg-navy-900 text-white dark:border-blue-300 dark:bg-blue-300 dark:text-navy-950"
        : "border-border bg-card text-ink-700 hover:border-navy-900 dark:text-muted-foreground dark:hover:border-white"
    }`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Browse Courses"
        subtitle="All ExamSphere courses. Enroll to add a course to My Courses."
      />

      <nav aria-label="Filter by programme" className="flex flex-wrap gap-2">
        <Link href="/dashboard/browse" className={chip(!active)}>
          All
        </Link>
        {PROGRAM_CATEGORY_NAMES.map((name) => (
          <Link
            key={name}
            href={`/dashboard/browse?category=${encodeURIComponent(name)}`}
            className={chip(active === name)}
          >
            {name}
          </Link>
        ))}
      </nav>

      <AnimatedCoursesGrid
        courses={courses}
        userCountry={(session?.user as any)?.country}
        clearHref="/dashboard/browse"
        hrefBase="/dashboard"
      />
    </div>
  );
}
