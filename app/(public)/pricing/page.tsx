import { redirect } from "next/navigation";

// ExamSphere doesn't sell subscriptions: every course lists its own fee on the Courses page.
export default function PricingPage() {
    redirect("/courses");
}
