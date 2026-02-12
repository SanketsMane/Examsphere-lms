"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle, ShieldCheck } from "lucide-react";
import { formatPriceSimple } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { QuickBookDrawer } from "@/components/marketing/QuickBookDrawer";

/**
 * Author: Sanket
 */

interface BookingWidgetProps {
    teacher: {
        id: string;
        name: string;
        image: string;
        headline: string;
        hourlyRate: number;
    };
    country?: string | null; // Added country support
}

export function BookingWidget({ teacher, country }: BookingWidgetProps) {
    return (
        <div className="bg-card border border-border rounded-xl shadow-lg p-6 sticky top-24">
            <h3 className="text-xl font-bold mb-4">Book a Session</h3>
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="text-2xl font-bold text-primary">
                    {formatPriceSimple(teacher.hourlyRate, country)}
                </span>
            </div>

            <div className="space-y-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                        <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Secure Booking</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            Book a 1-on-1 session directly with {teacher.name}. Satisfaction guaranteed.
                        </p>
                    </div>
                </div>
            </div>

            <QuickBookDrawer
                teacher={teacher}
                trigger={
                    <Button className="w-full py-6 text-lg font-bold shadow-md bg-blue-600 hover:bg-blue-700 text-white">
                        Book Now
                    </Button>
                }
            />

            <p className="text-xs text-center text-muted-foreground mt-4">
                100% Refund if cancelled 24h before session.
            </p>
        </div>
    );
}
