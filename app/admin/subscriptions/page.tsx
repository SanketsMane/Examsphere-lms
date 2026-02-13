
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket
import { prisma } from "@/lib/db";
import { SubscriptionPlansTable } from "./_components/subscription-plans-table";
import { SubscriptionPlanDialog } from "./_components/subscription-plan-dialog";
import { IconCreditCard } from "@tabler/icons-react";

export default async function SubscriptionManagementPage() {
  await requireAdmin();

    // Fetch all plans
    const plans = await prisma.subscriptionPlan.findMany({
        orderBy: { price: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <IconCreditCard className="h-8 w-8" />
                        Subscription Plans
                    </h1>
                    <p className="text-muted-foreground">Manage pricing tiers and subscription capabilities.</p>
                </div>
                <div>
                    <SubscriptionPlanDialog />
                </div>
            </div>

            <SubscriptionPlansTable plans={plans} />
        </div>
    );
}
