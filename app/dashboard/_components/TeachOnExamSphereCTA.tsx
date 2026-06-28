
"use client";

import { cn } from "@/lib/utils";
import { IconSchool, IconSparkles } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

export function TeachOnExamSphereCTA() {
    const pathname = usePathname();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                className="group relative overflow-hidden transition-all duration-300 hover:bg-transparent"
                tooltip="Teach on ExamSphere"
            >
                <Link
                    href="/register/teacher"
                    className={cn(
                        "relative flex items-center gap-3 rounded-xl border border-violet-500/10 p-2.5 transition-all duration-300",
                        "bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/30",
                        "group"
                    )}
                >
                    {/* Icon container */}
                    <div className="relative z-10 flex items-center justify-center bg-violet-500/10 rounded-lg p-1.5 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                        <IconSchool className="h-5 w-5" />
                    </div>

                    {/* Text content - Hidden when collapsed */}
                    {!isCollapsed && (
                        <div className="relative z-10 flex flex-col items-start leading-tight">
                            <span className="text-[13px] font-semibold text-foreground tracking-tight">Teach on ExamSphere</span>
                            <span className="text-[11px] text-muted-foreground font-medium">Apply as an instructor</span>
                        </div>
                    )}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
