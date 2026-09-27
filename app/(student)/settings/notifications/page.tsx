import { redirect } from "next/navigation";

// Legacy path outside the portal layout; notification settings live in-portal.
export default function NotificationSettingsRedirect() {
  redirect("/dashboard/settings/notifications");
}
