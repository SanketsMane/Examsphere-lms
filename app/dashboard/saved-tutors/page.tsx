import { redirect } from "next/navigation";

// Saved tutors had no working entry points; mentors are browsed in-portal.
export default function SavedTutorsPage() {
  redirect("/dashboard/mentors");
}
