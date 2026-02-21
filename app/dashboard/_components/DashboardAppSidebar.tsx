"use client";

import * as React from "react";
import {
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconSearch,
  IconSettings,
  IconMessage,
  IconVideo,
  IconBook,
  IconCalendar,
  IconUsers,
  IconBell,
  IconTicket,
  IconSparkles,
} from "@tabler/icons-react";
import Logo from "@/public/logo.png";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Find a Mentor",
      url: "/find-teacher",
      icon: IconSearch,
    },
    {
      title: "All Courses",
      url: "/courses",
      icon: IconBook,
    },
    {
      title: "My Courses",
      url: "/dashboard/courses",
      icon: IconBook,
    },
    {
      title: "Course Resources",
      url: "/dashboard/resources",
      icon: IconFileDescription,
    },
    {
      title: "My Groups",
      url: "/dashboard/groups",
      icon: IconUsers,
    },
    {
      title: "Live Sessions",
      url: "/dashboard/sessions",
      icon: IconVideo,
    },
    {
      title: "Wallet",
      url: "/dashboard/wallet",
      icon: IconTicket, // Using IconTicket as wallet icon placeholder
    },
    {
      title: "My Subscription",
      url: "/subscription",
      icon: IconSparkles,
    },
    {
      title: "Messages",
      url: "/dashboard/messages",
      icon: IconMessage,
    },
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: IconBell,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: IconFileAi,
    },
    {
      title: "Calendar",
      url: "/dashboard/calendar",
      icon: IconCalendar,
    },

    {
      title: "Kidokool Ai",
      url: "/dashboard/ai",
      icon: IconSparkles,
    },
    {
      title: "Certificates",
      url: "/dashboard/certificates",
      icon: IconSchool,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
    {
      title: "Support Tickets",
      url: "/dashboard/issues",
      icon: IconTicket,
    },
    {
      title: "Get Help",
      url: "/dashboard/help",
      icon: IconHelp,
    },
  ],
};

import { authClient } from "@/lib/auth-client";
import { IconSchool } from "@tabler/icons-react";
import { TeachOnKidokoolCTA } from "./TeachOnKidokoolCTA";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  /**
   * Application sidebar with dynamic navigation and role-based links.
   * Author: Sanket
   */
  const { data: session } = authClient.useSession();
  const role = (session?.user as any)?.role;

  // Create a copy of the secondary nav items with explicit type to allow 'highlight'
  const secondaryNav: { title: string; url: string; icon: any; highlight?: boolean }[] = [...data.navSecondary];

  // Add Teacher link based on role
  // If teacher -> Go to Teacher Dashboard
  if (role === "teacher") {
    secondaryNav.unshift({
      title: "Instructor Dashboard",
      url: "/teacher",
      icon: IconSchool,
      highlight: true,
    });
  }
  // If student -> Render distinctive CTA separately (not in standard list)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Image src={Logo} alt="Logo" className="size-5" />
                <span className="text-base font-semibold">KIDOKOOL.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        
        {/* Teach on Kidokool CTA - Only for non-teachers */}
        {role !== "teacher" && (
            <div className="px-2 mt-4 mb-2">
                <SidebarMenu>
                    <TeachOnKidokoolCTA />
                </SidebarMenu>
            </div>
        )}

        <NavSecondary items={secondaryNav} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
        <div className="px-4 py-2 text-center">
          <span className="text-[10px] text-muted-foreground/50 font-medium tracking-widest uppercase">
            v1.0.1
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
