import { Badge } from "@/components/ui/badge";
import { Gift } from "lucide-react";

/**
 * Free Trial Badge Component
 * Author: Sanket
 * 
 * Displays a badge indicating free trial availability or usage
 */

interface FreeTrialBadgeProps {
    variant?: "available" | "used" | "eligible";
    className?: string;
}

export function FreeTrialBadge({ variant = "available", className }: FreeTrialBadgeProps) {
    const variants = {
        available: {
            text: "Free Trial Available",
            className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200",
            icon: true
        },
        used: {
            text: "Free Trial Used",
            className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200",
            icon: false
        },
        eligible: {
            text: "Free Trial Eligible",
            className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200",
            icon: true
        }
    };

    const config = variants[variant];

    return (
        <Badge variant="outline" className={`${config.className} ${className || ""}`}>
            {config.icon && <Gift className="h-3 w-3 mr-1" />}
            {config.text}
        </Badge>
    );
}
