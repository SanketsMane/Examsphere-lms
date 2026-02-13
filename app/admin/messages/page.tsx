import { BroadcastForm } from "./_components/broadcast-form";
import { IconMessage, IconSpeakerphone } from "@tabler/icons-react";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
    await requireAdmin();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <IconSpeakerphone className="h-8 w-8" />
                    Broadcast Messaging
                </h1>
                <p className="text-muted-foreground">Send notifications and announcements to users</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <BroadcastForm />
                </div>

                <div className="md:col-span-1 space-y-6">
                    <div className="bg-muted/50 p-4 rounded-lg border">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <IconMessage className="h-4 w-4" />
                            Tips
                        </h3>
                        <ul className="text-sm space-y-2 text-muted-foreground">
                            <li>• Broadcasts are sent to all users in the selected group.</li>
                            <li>• Use this feature for important announcements like maintenance, new features, or policy changes.</li>
                            <li>• Messages are currently logged and sent via email (if configured).</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
