"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconLayoutDashboard,
  IconUserCircle,
  IconBook,
  IconPlus,
  IconUsersGroup,
  IconVideo,
  IconClipboardList,
  IconFolder,
  IconUsers,
  IconMessage,
  IconBell,
  IconCalendar,
  IconCurrencyRupee,
  IconWallet,
  IconCrown,
  IconChartHistogram,
  IconShieldCheck,
  IconSparkles,
  IconSettings,
  IconLifebuoy,
  IconHelp,
} from "@tabler/icons-react";

import Logo from "@/public/logo.png";
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

/** Instructor sidebar — grouped by workflow, unique icons, icon-rail collapse. */
const navGroups: NavGroup[] = [
  {
    items: [
      { title: "Dashboard", url: "/teacher", icon: IconLayoutDashboard, exact: true },
      { title: "Profile", url: "/teacher/profile", icon: IconUserCircle },
    ],
  },
  {
    label: "Teaching",
    items: [
      { title: "My Courses", url: "/teacher/courses", icon: IconBook },
      { title: "Create Course", url: "/teacher/courses/create", icon: IconPlus },
      { title: "Group Classes", url: "/teacher/groups", icon: IconUsersGroup },
      { title: "Live Sessions", url: "/teacher/sessions", icon: IconVideo },
      { title: "Quizzes", url: "/teacher/quizzes", icon: IconClipboardList },
      { title: "Resources", url: "/teacher/resources", icon: IconFolder },
    ],
  },
  {
    label: "Students",
    items: [
      { title: "Students", url: "/teacher/students", icon: IconUsers },
      { title: "Messages", url: "/teacher/messages", icon: IconMessage },
      { title: "Notifications", url: "/teacher/notifications", icon: IconBell },
      { title: "Calendar", url: "/teacher/calendar", icon: IconCalendar },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Pricing & Offerings", url: "/teacher/pricing", icon: IconCurrencyRupee },
      { title: "Payouts & Earnings", url: "/teacher/finance", icon: IconWallet },
      { title: "My Subscription", url: "/teacher/subscription", icon: IconCrown },
      { title: "Analytics", url: "/teacher/analytics", icon: IconChartHistogram },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Profile Verification", url: "/teacher/verification", icon: IconShieldCheck },
      { title: "ExamSphere AI", url: "/teacher/ai", icon: IconSparkles },
    ],
  },
];

const secondaryNav = [
  { title: "Student Dashboard", url: "/dashboard", icon: IconLayoutDashboard, highlight: true },
  { title: "Settings", url: "/teacher/settings", icon: IconSettings },
  { title: "Support Tickets", url: "/dashboard/issues", icon: IconLifebuoy },
  { title: "Get Help", url: "/teacher/help", icon: IconHelp },
];

export function TeacherSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/50">
              <Link href="/teacher">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Image src={Logo} alt="ExamSphere" className="size-6 object-contain" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-display font-bold text-base">ExamSphere</span>
                  <span className="truncate text-[11px] text-muted-foreground">Instructor Studio</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroups groups={navGroups} />
        <NavSecondary items={secondaryNav} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
