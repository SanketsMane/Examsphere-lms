import { getSubscriptionPlans, getUserSubscription } from "@/app/actions/subscriptions";
import { SubscriptionPlans } from "@/components/subscriptions/SubscriptionPlans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

/**
 * Subscription Management Page
 * Author: Sanket
 */

export default async function SubscriptionPage() {
    const { plans } = await getSubscriptionPlans();
    const { subscription } = await getUserSubscription();

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
                <p className="text-muted-foreground">Manage your subscription and billing details.</p>
            </div>

            {subscription ? (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Active Subscription</CardTitle>
                            <CardDescription>You are currently on the {subscription.plan.name} plan.</CardDescription>
                        </div>
                        <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'} className="h-6">
                            {subscription.status.toUpperCase()}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-muted-foreground font-medium">Billed</p>
                                <p className="font-semibold">${subscription.plan.price} / {subscription.plan.interval}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground font-medium">Next Billing Date</p>
                                <p className="font-semibold">
                                    {subscription.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'PPP') : 'N/A'}
                                </p>
                            </div>
                        </div>
                        {subscription.cancelAtPeriodEnd && (
                            <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-lg text-orange-800 text-sm">
                                Your subscription will be canceled on {format(new Date(subscription.currentPeriodEnd!), 'PPP')}. 
                                You will still have access until then.
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle>No Active Subscription</CardTitle>
                        <CardDescription>Pick a plan below to unlock premium features.</CardDescription>
                    </CardHeader>
                </Card>
            )}

            <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Available Plans</h2>
                <SubscriptionPlans plans={plans} currentPlanId={subscription?.planId} />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-lg">Billing History</h3>
                    <p className="text-sm text-muted-foreground">View your previous invoices and payment methods in our billing portal.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/settings/billing">Billing Portal</Link>
                </Button>
            </div>
        </div>
    );
}
