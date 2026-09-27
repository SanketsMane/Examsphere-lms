import { redirect } from "next/navigation";

// No student plans are sold, so there is nothing to manage here.
export default function StudentSubscriptionPage() {
  redirect("/dashboard");
}
