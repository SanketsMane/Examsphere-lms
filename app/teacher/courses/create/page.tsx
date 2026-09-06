import { CreateCourseForm } from "./_components/create-course-form";
import { getCourseCategoryOptions } from "@/lib/course-categories";
import { requireTeacher } from "@/app/data/auth/require-roles";

export const dynamic = "force-dynamic";

export default async function CourseCreationPage() {
  await requireTeacher();
    // Falls back to the built-in list when the Category table is empty, so the
    // dropdown is never rendered with no options (which made `category` — a
    // required field — impossible to satisfy).
    const categories = await getCourseCategoryOptions();

    return <CreateCourseForm categories={categories} />;
}
