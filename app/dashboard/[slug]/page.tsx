import { getCourseSidebarData } from "@/app/data/course/get-course-sidebar-data";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface iAppProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseSlugRoute({ params }: iAppProps) {
  const { slug } = await params;

  const course = await getCourseSidebarData(slug);

  // Skip empty chapters, and don't crash when a course has no chapters at all
  const firstLesson = course.course.chapter.flatMap((c) => c.lessons)[0];

  if (firstLesson) {
    redirect(`/dashboard/${slug}/${firstLesson.id}`);
  }
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <h2 className="text-2xl font-bold mb-2">No lessons yet</h2>
      <p className="text-muted-foreground">
        Lessons for this course haven&apos;t been published yet. Check back soon.
      </p>
    </div>
  );
}
