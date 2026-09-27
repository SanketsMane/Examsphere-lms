import { redirect } from "next/navigation";

// Old teacher-registration emails link here; the teacher queue now lives at /admin/teachers.
export default function LegacyTeamPage() {
  redirect("/admin/teachers");
}
