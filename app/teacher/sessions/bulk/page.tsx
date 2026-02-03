import { requireTeacher } from "@/app/data/auth/require-roles";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BulkSessionScheduling } from "@/components/teacher/BulkSessionScheduling";

/**
 * Bulk Session Scheduling Page
 * Author: Sanket
 */

export const dynamic = "force-dynamic";

export default async function BulkSessionsPage() {
  await requireTeacher();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/sessions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Bulk Scheduling</h1>
          <p className="text-muted-foreground mt-1">
            Import multiple sessions from a CSV file
          </p>
        </div>
      </div>

      <BulkSessionScheduling />
    </div>
  );
}
