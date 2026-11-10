import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { PageHeader, Panel } from "@/components/dashboard/es/dashboard-kit";
import { EXPERTISE_AREAS, PROGRAM_CATEGORY_NAMES } from "@/lib/examsphere-taxonomy";
import { NoteForm } from "../_components/NoteForm";

export const dynamic = "force-dynamic";

export default async function NewNotePage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <Link href="/admin/notes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Notes
      </Link>
      <PageHeader title="New note" subtitle="Step 1 of 2: details and pricing. You'll upload the PDF on the next screen." />
      <Panel>
        <NoteForm mode="create" programs={PROGRAM_CATEGORY_NAMES} subjects={EXPERTISE_AREAS} />
      </Panel>
    </div>
  );
}
