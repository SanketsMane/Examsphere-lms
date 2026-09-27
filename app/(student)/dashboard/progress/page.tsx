import { redirect } from "next/navigation";

// Orphan template page outside the portal layout; Analytics covers learning progress.
export default function ProgressPage() {
  redirect("/dashboard/analytics");
}
