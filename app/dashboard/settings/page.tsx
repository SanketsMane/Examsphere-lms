import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userSession = await requireUser();

  // Fetch full user data including preferences
  const user = await prisma.user.findUnique({
    where: { id: userSession.id },
    include: {
      preferences: true,
    },
  });

  if (!user) return null;

  // Fetch all categories for the interest section, grouped by parent
  const categories = await prisma.category.findMany({
    where: { 
      isActive: true,
      parentId: null // Fetch only top-level categories
    },
    select: { 
      id: true, 
      name: true,
      children: {
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <SettingsForm
      user={user}
      preferences={user.preferences}
      categories={categories}
    />
  );
}
