import { requireAdmin } from "@/app/data/auth/require-roles";
import { getSiteSettings } from "@/app/actions/settings";
import { FinanceSettingsForm } from "./_components/finance-settings-form";
import { PageHeader } from "@/app/admin/payments/_components/payments-ui";

export const dynamic = "force-dynamic";

/**
 * Earnings & Fees.
 *
 * Sits under the Payments group in the sidebar, so it uses the same PageHeader
 * as the other three screens. It previously added its own `container mx-auto
 * px-4 py-8`, which double-padded it inside the admin shell and made it the
 * only page in the group with a different content width.
 */
export default async function AdminFinancePage() {
  await requireAdmin();

  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings & Fees"
        description="Commission, tax and currency settings. These apply to all live courses, sessions and wallet transactions."
      />

      <FinanceSettingsForm initialData={settings} />
    </div>
  );
}
