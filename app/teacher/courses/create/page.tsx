import { redirect } from "next/navigation";
import { CreateCourseForm } from "./_components/create-course-form";
import { getCourseCategoryOptions } from "@/lib/course-categories";
import { getTeacherAuthoringBlock } from "@/lib/course-write";
import { requireTeacher } from "@/app/data/auth/require-roles";

export const dynamic = "force-dynamic";

export default async function CourseCreationPage() {
    const session = await requireTeacher();

    // CreateCourse enforces this too; redirecting here avoids a form that can never submit.
    const block = await getTeacherAuthoringBlock({ id: session.user.id, role: session.user.role });
    if (block) redirect("/teacher/verification");

    // Falls back to the built-in list when the Category table is empty, so the
    // dropdown is never rendered with no options (which made `category` — a
    // required field — impossible to satisfy).
    const categories = await getCourseCategoryOptions();

    return <CreateCourseForm categories={categories} />;
}
