import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

/**
 * Subscription Management Page - Simplified for Razorpay Migration
 * Author: Sanket
 */

export default async function SubscriptionPage() {
    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
                <p className="text-muted-foreground">Manage your subscription and billing details.</p>
            </div>

            <Card className="border-dashed flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 bg-primary/5 rounded-full mb-4">
                    <CreditCard className="h-10 w-10 text-primary" />
                </div>
                <CardHeader>
                    <CardTitle className="text-2xl">Subscription Migration in Progress</CardTitle>
                    <CardDescription className="max-w-md mx-auto text-base">
                        We are currently migrating our subscription system to Razorpay to provide a better payment experience.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        Coming Soon
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
