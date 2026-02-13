import { SettingsForm } from "./_components/settings-form";
import { getAdminSiteSettings } from "@/app/actions/settings";
import { Settings } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin(); // Ensure auth

  // Fetch all settings including secrets securely for Admin UI
  const settings = await getAdminSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Site Settings
        </h1>
        <p className="text-muted-foreground">Manage platform-wide settings, contact info, and branding.</p>
      </div>

      <div className="grid gap-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
