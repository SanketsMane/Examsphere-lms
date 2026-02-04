"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { createSubscriptionSession } from "@/app/actions/subscriptions";
import { toast } from "sonner";

/**
 * Subscription Plans UI
 * Author: Sanket
 */

interface Plan {
    id: string;
    name: string;
    description: string | null;
    price: number;
    interval: string;
    features: string[];
}

interface SubscriptionPlansProps {
    plans: Plan[];
    currentPlanId?: string;
}

export function SubscriptionPlans({ plans, currentPlanId }: SubscriptionPlansProps) {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleSubscribe = async (planId: string) => {
        try {
            setLoadingPlan(planId);
            const result = await createSubscriptionSession(planId);
            
            if (result.error) {
                toast.error(result.error);
                return;
            }

            if (result && 'url' in result && (result as any).url) {
                window.location.href = (result as any).url;
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
                <Card key={plan.id} className={`flex flex-col ${currentPlanId === plan.id ? 'border-primary shadow-lg ring-1 ring-primary' : ''}`}>
                    <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="mb-6">
                            <span className="text-4xl font-bold">${plan.price}</span>
                            <span className="text-muted-foreground ml-1">/{plan.interval}</span>
                        </div>
                        <ul className="space-y-3 text-sm">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full" 
                            variant={currentPlanId === plan.id ? "outline" : "default"}
                            disabled={currentPlanId === plan.id || !!loadingPlan}
                            onClick={() => handleSubscribe(plan.id)}
                        >
                            {loadingPlan === plan.id ? "Redirecting..." : currentPlanId === plan.id ? "Current Plan" : "Select Plan"}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
