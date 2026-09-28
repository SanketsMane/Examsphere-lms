import { ReactNode } from "react";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { AdminShell } from "./_components/AdminShell";

// Server-side gate: admin pages that don't call requireAdmin themselves would
// otherwise render their data for anyone.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return <AdminShell>{children}</AdminShell>;
}
