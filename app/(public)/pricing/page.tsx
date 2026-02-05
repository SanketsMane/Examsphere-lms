
import { getSubscriptionPlans } from "@/app/actions/subscriptions";
import PricingPageClient from "./_components/PricingPageClient";

export const metadata = {
    title: "Pricing - Kidokool LMS",
    description: "Simple, transparent pricing for teachers and students."
};

export default async function PricingPage() {
    const { plans } = await getSubscriptionPlans();

    return <PricingPageClient plans={plans} />;
}
