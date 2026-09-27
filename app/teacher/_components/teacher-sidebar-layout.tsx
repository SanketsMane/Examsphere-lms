"use client";

import { TeacherSidebar } from "@/components/sidebar/teacher-sidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { usePathname } from "next/navigation";

const SECTION_LABELS: Record<string, string> = {
    courses: "Courses",
    groups: "Group Classes",
    sessions: "Live Sessions",
    quizzes: "Quizzes",
    resources: "Resources",
    students: "Students",
    messages: "Messages",
    notifications: "Notifications",
    calendar: "Calendar",
    pricing: "Pricing & Offerings",
    finance: "Payouts & Earnings",
    subscription: "Subscription",
    analytics: "Analytics",
    verification: "Profile Verification",
    ai: "ExamSphere AI",
    profile: "Profile",
    settings: "Settings",
    help: "Help",
    bundles: "Bundles",
};

export function TeacherSidebarLayout({
    children,
    isApproved = true,
}: {
    children: React.ReactNode;
    isApproved?: boolean;
}) {
    const pathname = usePathname();
    const section = pathname?.split("/")[2];
    const pageLabel = (section && SECTION_LABELS[section]) || "Dashboard";

    // We rely on the Server Layout to handle auth redirects.
    // If this component renders, the user IS authorized.

    return (
        <SidebarProvider>
            <TeacherSidebar isApproved={isApproved} />
            <SidebarInset>
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/teacher">
                                    Teacher Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
