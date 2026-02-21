"use client";

import * as React from "react";
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconSearch,
  IconSettings,
  IconUsers,
  IconBook,
  IconPlus,
  IconFileText,
  IconUser,
  IconVideo,
  IconCalendar,
  IconBell,
  IconMessage,
  IconShield,
  IconWallet,
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

const teacherData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/teacher",
      icon: IconDashboard,
    },
    {
      title: "Profile",
      url: "/teacher/profile",
      icon: IconUser,
    },
    {
      title: "My Courses",
      url: "/teacher/courses",
      icon: IconBook,
    },
    {
      title: "Group Classes",
      url: "/teacher/groups",
      icon: IconUsers,
    },
    {
      title: "Create Course",
      url: "/teacher/courses/create",
      icon: IconPlus,
    },
    {
      title: "Live Sessions",
      url: "/teacher/sessions",
      icon: IconVideo,
    },
    {
      title: "My Subscription",
      url: "/teacher/subscription",
      icon: IconSparkles, 
    },
    {
      title: "Pricing & Offerings",
      url: "/teacher/pricing",
      icon: IconSettings, // Or IconCurrency/IconCoin if available, defaulting to Settings for now or reusing icon
    },
    {
      title: "Students",
      url: "/teacher/students",
      icon: IconUsers,
    },
    {
      title: "Analytics",
      url: "/teacher/analytics",
      icon: IconChartBar,
    },
    {
      title: "Profile Verification",
      url: "/teacher/verification",
      icon: IconShield,
    },
    {
      title: "Payouts & Earnings",
      url: "/teacher/finance",
      icon: IconWallet,
    },
    {
      title: "Quizzes",
      url: "/teacher/quizzes",
      icon: IconHelp,
    },
    {
      title: "Resources",
      url: "/teacher/resources",
      icon: IconFileText,
    },
    {
      title: "Messages",
      url: "/teacher/messages",
      icon: IconMessage,
    },
    {
      title: "Notifications",
      url: "/teacher/notifications",
      icon: IconBell,
    },
    {
      title: "Calendar",
      url: "/teacher/calendar",
      icon: IconCalendar,
    },
    {
      title: "Kidokool Ai",
      url: "/teacher/ai",
      icon: IconSparkles,
    },
  ],
  navSecondary: [
    {
      title: "Student Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      highlight: true,
    },
    {
      title: "Settings",
      url: "/teacher/settings",
      icon: IconSettings,
    },
    {
      title: "Support Tickets",
      url: "/dashboard/issues",
      icon: IconTicket,
    },
    {
      title: "Get Help",
      url: "/teacher/help",
      icon: IconHelp,
    },
  ],
};

export function TeacherSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/teacher">
                <Image src={Logo} alt="Logo" className="size-5" />
                <span className="text-base font-semibold">KIDOKOOL.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={teacherData.navMain} />
        <NavSecondary items={teacherData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}