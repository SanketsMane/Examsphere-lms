import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const requireUser = cache(async (shouldRedirect: boolean = true) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    if (shouldRedirect) {
      return redirect("/login");
    }
    return null;
  }

  return session.user as typeof session.user & { role: string | null };
});
