
import { requireUser } from "@/app/data/user/require-user";
import { getSubscriptionPlans, getUserSubscription, getSubscriptionUsage, getBillingHistory } from "@/app/actions/subscriptions";
import { AuthenticatedPricingCards } from "@/components/subscriptions/AuthenticatedPricingCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCreditCard, IconCrown } from "@tabler/icons-react";

export const dynamic = "force-dynamic";

export default async function StudentSubscriptionPage() {
    const user = await requireUser();
    // Verify student? Or just any user. The folder is (student) so implicitly student.

    const { plans } = await getSubscriptionPlans("STUDENT");
    // Filter for Student plans
    const studentPlans = plans || [];

    const { subscription } = await getUserSubscription();
    
    // New Data Fetching (updated to include enrollments)
    const { usage } = await getSubscriptionUsage();
    const { transactions } = await getBillingHistory();

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <IconCrown className="h-8 w-8 text-yellow-500" />
                    My Subscription
                </h1>
                <p className="text-muted-foreground">Manage your learning plan.</p>
            </div>

            {/* Current Plan Status */}
            <Card className="bg-muted/30 border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <IconCreditCard className="h-5 w-5" />
                        Current Plan
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold">
                                {subscription?.plan?.name || "Basic Student Plan (Free)"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {subscription ? `Renews on ${subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}` : "Free access active"}
                            </p>
                        </div>
                        <div className="text-right">
                             {subscription?.status === 'active' ? (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500 text-white shadow hover:bg-green-500/80">
                                    Active
                                </span>
                             ) : (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    Standard
                                </span>
                             )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Available Student Plans</h2>
                <AuthenticatedPricingCards plans={studentPlans} currentSubscriptionId={subscription?.id} />
             </div>

             {/* Usage Statistics Section */}
            {usage && usage.enrollments && (
                <div className="space-y-4">
                     <h2 className="text-xl font-semibold">Plan Usage</h2>
                     <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                             <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Active Course Enrollments</CardTitle>
                             </CardHeader>
                             <CardContent>
                                <div className="text-2xl font-bold">{usage.enrollments.used} / {usage.enrollments.limit}</div>
                                <div className="h-2 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary transition-all duration-500" 
                                        style={{ width: `${Math.min((usage.enrollments.used / usage.enrollments.limit) * 100, 100)}%` }}
                                    />
                                </div>
                             </CardContent>
                        </Card>
                     </div>
                </div>
            )}

            {/* Billing History Section */}
            <div className="space-y-4">
                 <h2 className="text-xl font-semibold">Billing History</h2>
                  <Card>
                    <CardContent className="p-0">
                         {transactions && transactions.length > 0 ? (
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left">
                                     <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                             <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                                             <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Description</th>
                                             <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Amount</th>
                                             <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        </tr>
                                     </thead>
                                     <tbody className="[&_tr:last-child]:border-0">
                                        {transactions.map((tx: any) => (
                                            <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                                                 <td className="p-4 align-middle">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                                 <td className="p-4 align-middle">
                                                    <div>{tx.description}</div>
                                                    <a href={`/invoice/${tx.id}`} target="_blank" className="text-xs text-primary hover:underline block mt-1">
                                                        Download Invoice
                                                    </a>
                                                 </td>
                                                 <td className="p-4 align-middle">{(tx.amount / 100).toFixed(2)} {tx.currency}</td>
                                                 <td className="p-4 align-middle">
                                                     <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500/10 text-green-500">
                                                        {tx.status}
                                                     </div>
                                                 </td>
                                            </tr>
                                        ))}
                                     </tbody>
                                </table>
                            </div>
                         ) : (
                                <div className="p-8 text-center text-muted-foreground">No billing history found.</div>
                         )}
                    </CardContent>
                  </Card>
            </div>
            
            {/* Safe Cancellation Zone */}
            {subscription && subscription.status === 'active' && (
                 <div className="pt-6 border-t">
                     <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
                     <p className="text-sm text-muted-foreground mb-4">
                        Cancelling your subscription will downgrade you to the Basic plan.
                     </p>
                    <AuthenticatedPricingCards 
                        plans={[]} 
                        currentSubscriptionId={subscription.id} 
                        showCancelButton={true} 
                    />
                 </div>
            )}
        </div>
    );
}
