import { redirect } from "next/navigation";

// Duplicated My Courses, which already shows course resources.
export default function ResourcesPage() {
  redirect("/dashboard/courses");
}
