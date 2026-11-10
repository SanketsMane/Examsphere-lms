import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { PageHeader, Panel } from "@/components/dashboard/es/dashboard-kit";
import { aiSpendThisMonthUsd, getNotesSettings } from "@/lib/notes/settings";
import { NotesSettingsForm } from "../_components/NotesSettingsForm";

export const dynamic = "force-dynamic";

export default async function NotesSettingsPage() {
  await requireAdmin();
  const [s, spent] = await Promise.all([getNotesSettings(), aiSpendThisMonthUsd()]);
  return (
    <div className="space-y-6">
      <Link href="/admin/notes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Notes
      </Link>
      <PageHeader title="Notes settings" subtitle="Refund policy for paid notes, and the AI used to generate notes." />
      <Panel>
        <NotesSettingsForm
          spentUsd={spent}
          initial={{
            refundWindowHours: s.refundWindowHours,
            refundMaxReadPercent: s.refundMaxReadPercent,
            refundRequiresNoDownload: s.refundRequiresNoDownload,
            autoApproveRefunds: s.autoApproveRefunds,
            aiModel: s.aiModel,
            aiMonthlyBudgetUsd: s.aiMonthlyBudgetUsd,
          }}
        />
      </Panel>
    </div>
  );
}
