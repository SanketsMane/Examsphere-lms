"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconLayoutDashboard,
  IconBook,
  IconBooks,
  IconFolder,
  IconVideo,
  IconCertificate,
  IconSparkles,
  IconCompass,
  IconUserSearch,
  IconUsersGroup,
  IconMessage,
  IconBell,
  IconCalendar,
  IconWallet,
  IconCrown,
  IconChartBar,
  IconSettings,
  IconLifebuoy,
  IconHelp,
  IconSchool,
} from "@tabler/icons-react";

import Logo from "@/public/logo.png";
import { authClient } from "@/lib/auth-client";
import { NavGroups, type NavGroup } from "@/components/sidebar/nav-groups";
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
import { TeachOnExamSphereCTA } from "./TeachOnExamSphereCTA";

/**
 * Student dashboard sidebar — organized into labeled sections with unique icons and an
 * icon-rail collapse. Author: Sanket
 */
const navGroups: NavGroup[] = [
  {
    items: [{ title: "Dashboard", url: "/dashboard", icon: IconLayoutDashboard, exact: true }],
  },
  {
    label: "Learning",
    items: [
      { title: "My Courses", url: "/dashboard/courses", icon: IconBook },
      { title: "Course Resources", url: "/dashboard/resources", icon: IconFolder },
      { title: "Live Sessions", url: "/dashboard/sessions", icon: IconVideo },
      { title: "Certificates", url: "/dashboard/certificates", icon: IconCertificate },
      { title: "ExamSphere AI", url: "/dashboard/ai", icon: IconSparkles },
    ],
  },
  {
    label: "Explore",
    items: [
      { title: "Browse Courses", url: "/courses", icon: IconBooks },
      { title: "Find a Mentor", url: "/find-teacher", icon: IconUserSearch },
      { title: "My Groups", url: "/dashboard/groups", icon: IconUsersGroup },
    ],
  },
  {
    label: "Activity",
    items: [
      { title: "Messages", url: "/dashboard/messages", icon: IconMessage },
      { title: "Notifications", url: "/dashboard/notifications", icon: IconBell },
      { title: "Calendar", url: "/dashboard/calendar", icon: IconCalendar },
      { title: "Analytics", url: "/dashboard/analytics", icon: IconChartBar },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Wallet", url: "/dashboard/wallet", icon: IconWallet },
      { title: "My Subscription", url: "/subscription", icon: IconCrown },
    ],
  },
];

const secondaryNav = [
  { title: "Settings", url: "/dashboard/settings", icon: IconSettings },
  { title: "Support Tickets", url: "/dashboard/issues", icon: IconLifebuoy },
  { title: "Get Help", url: "/dashboard/help", icon: IconHelp },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  const role = (session?.user as any)?.role;

  const secondary: { title: string; url: string; icon: any; highlight?: boolean }[] = [
    ...secondaryNav,
  ];
  if (role === "teacher") {
    secondary.unshift({
      title: "Instructor Dashboard",
      url: "/teacher",
      icon: IconSchool,
      highlight: true,
    });
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/50">
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Image src={Logo} alt="ExamSphere" className="size-6 object-contain" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-display font-bold text-base">ExamSphere</span>
                  <span className="truncate text-[11px] text-muted-foreground">Student Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroups groups={navGroups} />

        {role !== "teacher" && (
          <div className="px-2 mt-2 group-data-[collapsible=icon]:hidden">
            <SidebarMenu>
              <TeachOnExamSphereCTA />
            </SidebarMenu>
          </div>
        )}

        <NavSecondary items={secondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
