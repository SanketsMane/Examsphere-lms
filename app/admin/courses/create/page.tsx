import { prisma } from "@/lib/db";
import { CourseForm } from "./_components/course-form";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });
  return categories;
}

export default async function AdminCreateCoursePage() {
  await requireAdmin();
  const categories = await getCategories();

  return <CourseForm categories={categories} />;
}
