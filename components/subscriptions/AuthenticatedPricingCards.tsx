"use client";

import { SubscriptionPlan } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconCheck, IconX } from "@tabler/icons-react";
import { createSubscriptionSession, cancelSubscription } from "@/app/actions/subscriptions";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { formatPriceSimple } from "@/lib/currency"; // Use dynamic formatting - Author: Sanket
import { authClient } from "@/lib/auth-client"; // To get user country

// Helper to load Razorpay script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

interface PricingCardsProps {
    plans: SubscriptionPlan[];
    currentSubscriptionId?: string | null;
    showCancelButton?: boolean;
}


export function AuthenticatedPricingCards({ plans, currentSubscriptionId, showCancelButton }: PricingCardsProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [userCountry, setUserCountry] = useState<string | null>("India");

    useEffect(() => {
        loadRazorpayScript();
        
        // Fetch current user country from session - Author: Sanket
        const fetchUser = async () => {
            const { data: session } = await authClient.getSession();
            if (session?.user) {
                setUserCountry((session.user as any).country || "India");
            }
        };
        fetchUser();
    }, []);

    const handleSubscribe = async (plan: SubscriptionPlan) => {
        setLoading(plan.id);
        try {
            // 1. Create Subscription on Server
            const res = await createSubscriptionSession(plan.id);
            if (res.error) {
                toast.error(res.error);
                return;
            }

            // 2. Open Razorpay Checkout
            // res should contain { subscriptionId, key, ... }
            if (res.subscriptionId && res.key) {
                const options = {
                    key: res.key,
                    subscription_id: res.subscriptionId,
                    name: "Kidokool LMS",
                    description: `Subscription to ${plan.name}`,
                    handler: async function (response: any) {
                        toast.success("Subscription activated successfully!");
                        // Redirect to subscription page to see status
                        window.location.href = "/subscription";
                    },
                    modal: {
                        ondismiss: function () {
                            setLoading(null);
                        }
                    },
                    theme: {
                         color: "#F37254"
                    }
                };
                
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            }

        } catch (error) {
            toast.error("Failed to initiate subscription");
            console.error(error);
        } finally {
            setLoading(null);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel your subscription? You will lose premium benefits at the end of the billing period.")) return;
        
        setLoading("cancel");
        try {
            const res = await cancelSubscription();
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Subscription cancelled successfully");
                window.location.reload();
            }
        } catch (error) {
            toast.error("Failed to cancel");
        } finally {
            setLoading(null);
        }
    };

    if (showCancelButton && currentSubscriptionId) {
        return (
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Cancel Subscription</CardTitle>
                    <CardDescription>
                        Downgrade to the Basic plan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Your premium features will remain active until the end of the current billing cycle. 
                        After that, you will be reverted to the free plan limits.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button 
                        variant="destructive" 
                        onClick={handleCancel}
                        disabled={loading === "cancel"}
                    >
                        {loading === "cancel" ? "Cancelling..." : "Cancel Subscription"}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
                <Card key={plan.id} className={plan.isDefault ? "border-primary shadow-lg relative" : ""}>
                     {plan.isDefault && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">
                            Most Popular (Free)
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">
                                {formatPriceSimple(plan.price, userCountry)}
                            </span>
                            <span className="text-muted-foreground">/{plan.interval}</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <IconCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full" 
                            variant={plan.price === 0 ? "outline" : "default"}
                            onClick={() => handleSubscribe(plan)}
                            disabled={!!loading || plan.price === 0} // Free plan is default/automatic usually
                        >
                            {loading === plan.id ? "Processing..." : plan.price === 0 ? "Current Plan" : "Subscribe Now"}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
