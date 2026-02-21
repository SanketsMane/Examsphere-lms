"use client";

import * as React from "react";
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconListDetails,
  IconSearch,
  IconSettings,
  IconUsers,
  IconFolder,
  IconSchool,
  IconUserCircle,
  IconCreditCard,
  IconFileText,
  IconShieldCheck,
  IconBell,
  IconCalendar,
  IconVideo,
  IconSpeakerphone,
  IconShieldCheck as IconVerification,
  IconUserCheck,

  IconShield,
  IconWallet,
  IconTicket,
  IconSparkles,
  IconBook,
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
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Teachers",
      url: "/admin/teachers",
      icon: IconSchool,
    },
    {
      title: "Students",
      url: "/admin/students",
      icon: IconUserCircle,
    },
    {
      title: "Courses",
      url: "/admin/courses",
      icon: IconListDetails,
    },
    {
      title: "Live Sessions",
      url: "/admin/live-sessions",
      icon: IconVideo,
    },
    {
      title: "Payments",
      url: "/admin/payments",
      icon: IconCreditCard,
      items: [
        {
          title: "All Transactions",
          url: "/admin/payments/transactions",
          icon: IconListDetails,
        },
        {
          title: "Withdraw Requests",
          url: "/admin/payments/payouts",
          icon: IconWallet,
        },
        {
          title: "Refund Requests",
          url: "/admin/payments/refunds",
          icon: IconTicket,
        },
        {
          title: "Earnings & Fees",
          url: "/admin/finance",
          icon: IconChartBar,
        },
      ],
    },
    {
      title: "Coupons",
      url: "/admin/coupons",
      icon: IconTicket,
    },
    {
      title: "Subscription Plans",
      url: "/admin/subscriptions",
      icon: IconSparkles,
    },
    {
      title: "Broadcasts",
      url: "/admin/broadcasts",
      icon: IconSpeakerphone,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: IconChartBar,
    },
    {
      title: "Category",
      url: "/admin/categories",
      icon: IconFolder,
    },
    {
      title: "Subjects",
      url: "/admin/subjects",
      icon: IconBook,
    },
    {
      title: "CMS Pages",
      url: "/admin/pages",
      icon: IconFileText,
    },
    {
      title: "Testimonials",
      url: "/admin/testimonials",
      icon: IconUsers,
    },
    {
      title: "Settings",
      url: "/admin/verification",
      icon: IconShieldCheck,
    },
    {
      title: "Metadata",
      url: "/admin/metadata",
      icon: IconSettings,
    },
    {
      title: "Email System",
      url: "/admin/email",
      icon: IconFileText,
      items: [
        {
          title: "Templates",
          url: "/admin/email/templates",
          icon: IconListDetails,
        },
        {
          title: "Marketing",
          url: "/admin/email/marketing",
          icon: IconSpeakerphone,
        },
        {
          title: "Diagnostics",
          url: "/admin/email",
          icon: IconSettings,
        }
      ]
    },
    {
      title: "Blog",
      url: "/admin/blog",
      icon: IconFileText,
    },
    {
      title: "Messages",
      url: "/admin/messages",
      icon: IconSpeakerphone,
    },
    {
      title: "Support Tickets",
      url: "/admin/issues",
      icon: IconTicket,
    },
    {
      title: "Verification Center",
      url: "/admin/verification",
      icon: IconVerification,
      items: [
        {
          title: "Profile Verification",
          url: "/admin/verification/profiles",
          icon: IconUserCheck,
        },
        {
          title: "Payouts & Earnings",
          url: "/admin/verification/payouts",
          icon: IconWallet,
        },
      ],
    },
    {
      title: "Kidokool Ai",
      url: "/admin/ai",
      icon: IconSparkles,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/admin/help",
      icon: IconHelp,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-sidebar-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconDashboard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-lg tracking-wide">KIDOKOOL</span>
                  <span className="truncate text-xs text-muted-foreground/70">Admin Console</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
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
