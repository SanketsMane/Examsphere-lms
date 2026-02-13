import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket
import { getSiteSettings } from "@/app/actions/settings";
import { Banknote } from "lucide-react";
import { FinanceSettingsForm } from "./_components/finance-settings-form";

export const dynamic = "force-dynamic";

/**
 * Admin Finance Dashboard Page
 * @author Sanket
 */
export default async function AdminFinancePage() {
    await requireAdmin();

    const settings = await getSiteSettings();

    return (
        <div className="space-y-6 container mx-auto px-4 py-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Banknote className="h-8 w-8 text-green-600" />
                    Earnings & Financial Controls
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                    Manage platform earnings, tax configuration, and currency settings. 
                    These settings affect all live courses, sessions, and wallet transactions.
                </p>
            </div>

            <div className="pt-4">
                <FinanceSettingsForm initialData={settings} />
            </div>
        </div>
    );
}
