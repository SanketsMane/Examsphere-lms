import { adminGetCourses } from "@/app/data/admin/admin-get-courses";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import {
  AdminCourseCard,
  AdminCourseCardSkeleton,
} from "./_components/AdminCourseCard";
import { EmptyState } from "@/components/general/EmptyState";
import { Suspense } from "react";
import { requireTeacherOrAdmin } from "@/app/data/auth/require-roles";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Courses</h1>

        <Link className={buttonVariants()} href="/admin/courses/create">
          Create Course
        </Link>
      </div>

      <Suspense fallback={<AdminCourseCardSkeletonLayout />}>
        <RenderCourses page={currentPage} />
      </Suspense>
    </>
  );
}

async function RenderCourses({ page }: { page: number }) {
  const session = await requireTeacherOrAdmin();
  const { data, totalCount } = await adminGetCourses(page, 10);
  const totalPages = Math.ceil(totalCount / 10);

  return (
    <>
      {data.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Create a new course to get started"
          buttonText="Create Course"
          href="/admin/courses/create"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7">
          {data.map((course) => (
            <AdminCourseCard key={course.id} data={course} userRole={(session.user as any)?.role} />
          ))}
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" asChild disabled={page <= 1}>
            <Link href={page <= 1 ? "#" : `/admin/courses?page=${page - 1}`} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>Previous</Link>
          </Button>
          <div className="text-sm font-medium">
            Page {page} of {totalPages}
          </div>
          <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
            <Link href={page >= totalPages ? "#" : `/admin/courses?page=${page + 1}`} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}>Next</Link>
          </Button>
        </div>
      )}
    </>
  );
}

function AdminCourseCardSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7">
      {Array.from({ length: 4 }).map((_, index) => (
        <AdminCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
