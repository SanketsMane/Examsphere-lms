"use client";

import { SiteHeader } from "@/components/sidebar/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "./_components/DashboardAppSidebar";
import { useAuth } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";


export default function DashboardLayout({ children }: { children: ReactNode }) {
  /**
   * Main dashboard layout with hydration fixing logic.
   * Author: Sanket
   */
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (!mounted || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "4.25rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>

        <SiteHeader />
        <div className="flex flex-1 flex-col h-[calc(100vh-var(--header-height))]">
          <div className="@container/main flex flex-1 flex-col gap-2 h-full">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 h-full">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
