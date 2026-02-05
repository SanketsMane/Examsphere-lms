
"use client";

import { useState } from "react";
import { PublicPricingCards } from "./public-pricing-cards";
import { SubscriptionPlan } from "@prisma/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PricingPageProps {
  plans: SubscriptionPlan[];
}

export default function PricingPageClient({ plans }: PricingPageProps) {
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("TEACHER");

  const filteredPlans = plans.filter((plan) => (plan.role || "TEACHER") === role);

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Choose the plan that fits your learning journey. No hidden fees. Cancel anytime.
        </p>

        <div className="flex justify-center mt-8">
            <Tabs defaultValue="TEACHER" onValueChange={(v) => setRole(v as any)} className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger value="TEACHER" className="text-base font-semibold">For Teachers</TabsTrigger>
                    <TabsTrigger value="STUDENT" className="text-base font-semibold">For Students</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
      </div>

      <PublicPricingCards plans={filteredPlans} role={role} />

      <div className="mt-20 text-center space-y-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
        
        {role === "TEACHER" ? (
             <div className="grid md:grid-cols-2 gap-8 text-left">
                <div>
                    <h3 className="font-semibold text-lg mb-2">Can I switch plans later?</h3>
                    <p className="text-slate-600">Yes, you can upgrade or downgrade your plan at any time from your dashboard.</p>
                </div>
                <div>
                        <h3 className="font-semibold text-lg mb-2">Is there a transaction fee?</h3>
                    <p className="text-slate-600">We charge a small commission on sales. Premium plans enjoy lower rates.</p>
                </div>
            </div>
        ) : (
             <div className="grid md:grid-cols-2 gap-8 text-left">
                <div>
                    <h3 className="font-semibold text-lg mb-2">What happens to my courses if I cancel?</h3>
                    <p className="text-slate-600">You retain access to any free courses you've enrolled in. Premium course access depends on your new plan.</p>
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-2">Can I download videos?</h3>
                    <p className="text-slate-600">Offline downloads are available on our Pro Student plan.</p>
                </div>
            </div>
        )}
       
      </div>
    </div>
  );
}
