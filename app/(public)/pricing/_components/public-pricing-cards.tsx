"use client";

import { SubscriptionPlan } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconCheck } from "@tabler/icons-react";
import Link from "next/link";

interface PublicPricingCardsProps {
    plans: SubscriptionPlan[];
}

export function PublicPricingCards({ plans }: PublicPricingCardsProps) {
    return (
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
                <Card key={plan.id} className={`flex flex-col ${plan.isDefault ? "border-primary shadow-xl scale-105 relative z-10" : "shadow-md hover:shadow-lg transition-shadow"}`}>
                     {plan.isDefault && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                            POPULAR
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="mt-4">
                            <span className="text-4xl font-bold">
                                {plan.price === 0 ? "Free" : `₹${plan.price}`}
                            </span>
                            <span className="text-muted-foreground text-lg">/{plan.interval}</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3 text-sm">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="mt-1 bg-green-100 p-1 rounded-full">
                                         <IconCheck className="h-4 w-4 text-green-600 shrink-0" />
                                    </div>
                                    <span className="text-slate-700">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full text-lg py-6" 
                            variant={plan.price === 0 ? "outline" : "default"}
                            asChild
                        >
                            <Link href="/register?role=teacher">
                                {plan.price === 0 ? "Get Started for Free" : "Start Teaching Premium"}
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
