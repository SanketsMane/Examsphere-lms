import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userSession = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: userSession.id },
    include: {
      preferences: true,
      studentProfile: true,
    },
  });

  if (!user) return null;

  return (
    <SettingsForm
      user={user}
      preferences={user.preferences}
      studentProfile={user.studentProfile}
    />
  );
}
