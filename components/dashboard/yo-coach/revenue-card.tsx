"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { formatPriceSimple, getCurrencyConfig } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket

interface RevenueCardProps {
    title: string;
    amount: string;
    subTitle?: string;
    icon: React.ReactNode;
    variant?: "blue" | "orange" | "purple";
    className?: string;
}

export function RevenueCard({
    title,
    amount,
    subTitle,
    icon,
    variant = "blue",
    className,
}: RevenueCardProps) {
    const [userCountry, setUserCountry] = useState<string>("India");

    useEffect(() => {
        const fetchUser = async () => {
            const { data: session } = await authClient.getSession();
            if (session?.user) {
                setUserCountry((session.user as any).country || "India");
            }
        };
        fetchUser();
    }, []);

    const currencyConfig = getCurrencyConfig(userCountry);
    const displaySubtitle = subTitle || `This month ${currencyConfig.symbol}0.00`;
    const variants = {
        blue: "bg-blue-50 text-blue-600",
        orange: "bg-orange-50 text-orange-600",
        purple: "bg-purple-50 text-purple-600",
    };

    const iconVariants = {
        blue: "text-blue-600",
        orange: "text-orange-600",
        purple: "text-purple-600",
    };

    return (
        <Card className={cn("overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow", className)}>
            <CardContent className="p-6 relative">
                {/* Background Decorative Shape */}
                <div className="absolute top-0 right-0 h-full w-1/3 overflow-hidden opacity-10 pointer-events-none">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                        <path d="M0 0 L100 0 L100 100 C50 100 20 50 0 0 Z" fill="currentColor" className={iconVariants[variant]} />
                    </svg>
                </div>

                <div className="flex flex-col relative z-10">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-4", variants[variant])}>
                        {icon}
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">{amount}</h3>
                        <p className="text-xs text-muted-foreground font-medium">{displaySubtitle}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
