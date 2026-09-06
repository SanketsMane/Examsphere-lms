import { getAllBroadcasts } from "@/app/actions/broadcasts";
import { BroadcastClient } from "./_components/broadcast-client";
import { requireAdmin } from "@/app/data/auth/require-roles";

// Author: Sanket
// Admin page for managing broadcast banners
export default async function BroadcastsPage() {
  await requireAdmin();
  const broadcasts = await getAllBroadcasts();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Broadcasts & Banners</h1>
      </div>
      <BroadcastClient initialBroadcasts={broadcasts as any} />
    </div>
  );
}
