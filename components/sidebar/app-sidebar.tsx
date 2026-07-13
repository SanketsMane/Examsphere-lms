"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconLayoutDashboard,
  IconUsers,
  IconSchool,
  IconUserCircle,
  IconInbox,
  IconBook,
  IconBooks,
  IconFolder,
  IconVideo,
  IconCreditCard,
  IconListDetails,
  IconWallet,
  IconReceiptRefund,
  IconChartBar,
  IconChartHistogram,
  IconTicket,
  IconCrown,
  IconSpeakerphone,
  IconMail,
  IconSend,
  IconActivity,
  IconArticle,
  IconFileText,
  IconStar,
  IconMessage,
  IconLifebuoy,
  IconShieldCheck,
  IconUserCheck,
  IconSparkles,
  IconTags,
  IconSettings,
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

/** Admin console sidebar — grouped by domain, unique icons, icon-rail collapse. */
const navGroups: NavGroup[] = [
  {
    items: [{ title: "Dashboard", url: "/admin", icon: IconLayoutDashboard, exact: true }],
  },
  {
    label: "People",
    items: [
      { title: "Users", url: "/admin/users", icon: IconUsers },
      { title: "Teachers", url: "/admin/teachers", icon: IconSchool },
      { title: "Students", url: "/admin/students", icon: IconUserCircle },
      { title: "Inquiries", url: "/admin/inquiries", icon: IconInbox },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Courses", url: "/admin/courses", icon: IconBook },
      { title: "Categories", url: "/admin/categories", icon: IconFolder },
      { title: "Subjects", url: "/admin/subjects", icon: IconBooks },
      { title: "Live Sessions", url: "/admin/live-sessions", icon: IconVideo },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        title: "Payments",
        url: "/admin/payments",
        icon: IconCreditCard,
        items: [
          { title: "All Transactions", url: "/admin/payments/transactions", icon: IconListDetails },
          { title: "Withdraw Requests", url: "/admin/payments/payouts", icon: IconWallet },
          { title: "Refund Requests", url: "/admin/payments/refunds", icon: IconReceiptRefund },
          { title: "Earnings & Fees", url: "/admin/finance", icon: IconChartBar },
        ],
      },
      { title: "Coupons", url: "/admin/coupons", icon: IconTicket },
      { title: "Subscription Plans", url: "/admin/subscriptions", icon: IconCrown },
    ],
  },
  {
    label: "Marketing & Content",
    items: [
      { title: "Broadcasts", url: "/admin/broadcasts", icon: IconSpeakerphone },
      {
        title: "Email System",
        url: "/admin/email",
        icon: IconMail,
        items: [
          { title: "Templates", url: "/admin/email/templates", icon: IconListDetails },
          { title: "Marketing", url: "/admin/email/marketing", icon: IconSend },
          { title: "Diagnostics", url: "/admin/email", icon: IconActivity },
        ],
      },
      { title: "Blog", url: "/admin/blog", icon: IconArticle },
      { title: "CMS Pages", url: "/admin/pages", icon: IconFileText },
      { title: "Testimonials", url: "/admin/testimonials", icon: IconStar },
    ],
  },
  {
    label: "Support & Moderation",
    items: [
      { title: "Messages", url: "/admin/messages", icon: IconMessage },
      { title: "Support Tickets", url: "/admin/issues", icon: IconLifebuoy },
      {
        title: "Verification Center",
        url: "/admin/verification",
        icon: IconShieldCheck,
        items: [
          { title: "Profile Verification", url: "/admin/verification/profiles", icon: IconUserCheck },
          { title: "Payouts & Earnings", url: "/admin/verification/payouts", icon: IconWallet },
        ],
      },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Analytics", url: "/admin/analytics", icon: IconChartHistogram },
      { title: "ExamSphere AI", url: "/admin/ai", icon: IconSparkles },
      { title: "Metadata", url: "/admin/metadata", icon: IconTags },
    ],
  },
];

const secondaryNav = [
  { title: "Settings", url: "/admin/settings", icon: IconSettings },
  { title: "Get Help", url: "/admin/help", icon: IconHelp },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/50">
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Image src={Logo} alt="ExamSphere" className="size-6 object-contain" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-display font-bold text-base">ExamSphere</span>
                  <span className="truncate text-[11px] text-muted-foreground">Admin Console</span>
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
