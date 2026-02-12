"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, MoreHorizontal, Calendar, ArrowRight, Wallet, Plus, CreditCard, Search, HelpCircle, BookOpen } from "lucide-react";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket

// --- STATS CARD ---
interface StatsCardProps {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ReactNode;
    trend?: "up" | "down" | "neutral";
    className?: string;
    delay?: number;
    variant?: "blue" | "green" | "purple" | "orange" | "pink";
}

export function StatsCard({
    title,
    value,
    subValue,
    icon,
    trend,
    className,
    delay = 0,
    variant = "blue",
}: StatsCardProps) {

    const variants = {
        blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
        green: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
        purple: "from-violet-500 to-purple-600 shadow-purple-500/20",
        orange: "from-orange-500 to-red-500 shadow-orange-500/20",
        pink: "from-pink-500 to-rose-500 shadow-pink-500/20",
    };

    const iconBgVariants = {
        blue: "bg-white/20 text-white",
        green: "bg-white/20 text-white",
        purple: "bg-white/20 text-white",
        orange: "bg-white/20 text-white",
        pink: "bg-white/20 text-white",
    };

    return (
        <MotionWrapper delay={delay} variant="scale">
            <Card className={cn(
                "overflow-hidden border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br text-white",
                variants[variant],
                className
            )}>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100/80 text-sm font-medium mb-1">{title}</p>
                            <h3 className="text-3xl font-bold tracking-tight text-white mb-2">{value}</h3>
                            {subValue && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white/90 font-medium backdrop-blur-sm">
                                        {trend === "up" && "↑ "}
                                        {trend === "down" && "↓ "}
                                        {subValue}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className={cn("p-3 rounded-xl backdrop-blur-md", iconBgVariants[variant])}>
                            {icon}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </MotionWrapper>
    );
}

// --- WALLET WIDGET ---
export function WalletWidget() {
    const [userCountry, setUserCountry] = useState<string>("India");
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        const fetchData = async () => {
            const { data: session } = await authClient.getSession();
            if (session?.user) {
                setUserCountry((session.user as any).country || "India");
            }
            
            // In a real app, balance would come from props or a fetcher
            // For now, let's keep the mock 12450 but localized
            setBalance(12450);
        };
        fetchData();
    }, []);

    return (
        <MotionWrapper delay={0.1} variant="scale">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden h-full flex flex-col justify-between group">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 decoration-slice" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Total Balance</p>
                            <h3 className="text-3xl font-bold">{formatPriceSimple(balance, userCountry)}</h3>
                        </div>
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-auto">
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-900/20 font-semibold rounded-xl">
                            <Plus className="h-4 w-4 mr-1" /> Add Funds
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl backdrop-blur-sm">
                            <CreditCard className="h-4 w-4 mr-1" /> Withdraw
                        </Button>
                    </div>
                </div>
            </div>
        </MotionWrapper>
    );
}

// --- QUICK ACTIONS WIDGET ---
export function QuickActions() {
    const actions = [
        { label: "Find Tutor", icon: Search, color: "bg-blue-100 text-blue-600", link: "/find-teacher" },
        { label: "My Classes", icon: BookOpen, color: "bg-purple-100 text-purple-600", link: "/dashboard/courses" },
        { label: "Calendar", icon: Calendar, color: "bg-orange-100 text-orange-600", link: "/dashboard/calendar" },
        { label: "Support", icon: HelpCircle, color: "bg-green-100 text-green-600", link: "/contact" },
    ];

    return (
        <Card className="border-none shadow-md bg-white dark:bg-card rounded-2xl h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pb-6">
                {actions.map((action, i) => (
                    <Link href={action.link} key={i}>
                        <div className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-100 dark:border-gray-800 transition-all cursor-pointer group h-full">
                            <div className={cn("p-3 rounded-full mb-2 transition-transform group-hover:scale-110", action.color)}>
                                <action.icon className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-semibold text-center text-gray-700 dark:text-gray-300">{action.label}</span>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}

// --- SCHEDULE WIDGET ---
interface ScheduleItem {
    id: string;
    title: string;
    time: string;
    date: string;
    user?: string;
    image?: string;
    type: "class" | "meeting" | "review";
}

export function ScheduleWidget({ items }: { items: ScheduleItem[] }) {
    const displayItems = items.slice(0, 3);

    return (
        <Card className="border shadow-sm bg-white dark:bg-card border-gray-200 dark:border-gray-800 rounded-xl h-full">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-gray-900 dark:text-white">Upcoming Schedule</CardTitle>
                    <Link href="/dashboard/calendar">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                            <Calendar className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {displayItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-gray-500">
                        <div className="h-10 w-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-2">
                            <Calendar className="h-5 w-5 text-gray-300" />
                        </div>
                        <p className="text-xs font-medium">No upcoming events.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {displayItems.map((item, i) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                                <div className="flex flex-col items-center justify-center w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800">
                                    <span className="text-[9px] uppercase tracking-wider opacity-70 leading-none mb-0.5">{item.date.split(' ')[0].substring(0, 3) || 'TODAY'}</span>
                                    <span className="text-sm leading-none">{item.date.includes(' ') ? item.date.split(' ')[1] : new Date().getDate()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary transition-colors">{item.title}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{item.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                    <Link href="/dashboard/calendar" className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8 border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:hover:bg-gray-800">
                            View Full Calendar
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

// --- ACTIVITY FEED ---
interface ActivityItem {
    id: string;
    text: string;
    time: string;
    date?: string;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
    return (
        <Card className="border-none shadow-md bg-white dark:bg-card rounded-2xl h-full">
            <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
                <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6 relative ml-3">
                    {/* Vertical Line */}
                    <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-gray-100 dark:bg-gray-800" />

                    {items.map((item, i) => (
                        <div key={item.id} className="relative pl-8 group">
                            <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-white dark:bg-card border-[3px] border-indigo-400 z-10 shadow-sm group-hover:scale-125 transition-transform" />
                            <p className="text-sm font-medium text-foreground leading-relaxed">{item.text}</p>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">{item.time}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
