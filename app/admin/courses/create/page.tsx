import { getCourseCategoryOptions } from "@/lib/course-categories";
import { CourseForm } from "./_components/course-form";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";


export default async function AdminCreateCoursePage() {
  await requireAdmin();
  const categories = await getCourseCategoryOptions();

  return <CourseForm categories={categories} />;
}
