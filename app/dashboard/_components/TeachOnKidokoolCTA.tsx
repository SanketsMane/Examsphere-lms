
"use client";

import { cn } from "@/lib/utils";
import { IconSchool, IconSparkles } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

export function TeachOnKidokoolCTA() {
    const pathname = usePathname();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                className="group relative overflow-hidden transition-all duration-300 hover:bg-transparent"
                tooltip="Teach on Kidokool"
            >
                <Link
                    href="/register/teacher"
                    className={cn(
                        "relative flex items-center gap-3 rounded-lg border border-transparent p-2 transition-all duration-300",
                        // Gradient background with animation
                        "bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] animate-gradient",
                        "hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:scale-[1.02]",
                        "text-white font-medium"
                    )}
                >
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />

                    {/* Icon container */}
                    <div className="relative z-10 flex items-center justify-center bg-white/10 rounded-md p-1 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                        <IconSchool className="h-4 w-4 text-white" />
                    </div>

                    {/* Text content - Hidden when collapsed */}
                    {!isCollapsed && (
                        <div className="relative z-10 flex flex-col items-start leading-none opacity-100 transition-opacity duration-200">
                            <span className="text-sm font-bold tracking-tight">Teach on Kidokool</span>
                            <span className="text-[10px] text-white/80 font-medium mt-0.5">Start your journey</span>
                        </div>
                    )}
                    
                    {/* Floating sparkles for flair */}
                    {!isCollapsed && (
                        <IconSparkles className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    )}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
