import { getSubscriptionPlans } from "@/app/actions/subscriptions";
import { PublicPricingCards } from "./_components/public-pricing-cards";

export const metadata = {
    title: "Pricing - Kidokool LMS",
    description: "Simple, transparent pricing for teachers. Start for free and upgrade as you grow."
};

export default async function PricingPage() {
    const { plans } = await getSubscriptionPlans();

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4">
             <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                    Simple, Transparent Pricing
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Choose the plan that fits your teaching journey. No hidden fees. Cancel anytime.
                </p>
            </div>
            
            <PublicPricingCards plans={plans} />

            <div className="mt-20 text-center space-y-6 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
                <div className="grid md:grid-cols-2 gap-8 text-left">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Can I switch plans later?</h3>
                        <p className="text-slate-600">Yes, you can upgrade or downgrade your plan at any time from your dashboard.</p>
                    </div>
                    <div>
                         <h3 className="font-semibold text-lg mb-2">Is there a transaction fee?</h3>
                        <p className="text-slate-600">We charge a small commission on your course sales. Premium plans enjoy lower commission rates.</p>
                    </div>
                     <div>
                         <h3 className="font-semibold text-lg mb-2">How do payouts work?</h3>
                        <p className="text-slate-600">Earnings are transferred to your bank account automatically on a weekly basis.</p>
                    </div>
                     <div>
                         <h3 className="font-semibold text-lg mb-2">Do I need a credit card for the free plan?</h3>
                        <p className="text-slate-600">No, you can get started with the Free plan without any payment details.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
