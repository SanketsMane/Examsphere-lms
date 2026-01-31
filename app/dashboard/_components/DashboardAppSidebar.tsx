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
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  /**
   * Application sidebar with dynamic navigation and role-based links.
   * Author: Sanket
   */
  const { data: session } = authClient.useSession();
  const role = session?.user?.role;

  // Create a copy of the secondary nav items
  const secondaryNav = [...data.navSecondary];

  // Add Teacher link based on role
  // If teacher -> Go to Teacher Dashboard
  // If student -> Go to Teacher Registration
  secondaryNav.unshift({
    title: role === "teacher" ? "Instructor Dashboard" : "Teach on Kidokool",
    url: role === "teacher" ? "/teacher" : "/register/teacher",
    icon: IconSchool,
  });

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
        <NavSecondary items={secondaryNav} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
