"use client";

import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
import { useEffect } from "react";

interface Session {
    id: string;
    title: string;
    scheduledAt: Date | string;
    duration: number; // in minutes
    teacher: {
        user: { name: string; image?: string | null };
    };
    price: number;
}

interface SessionCalendarViewProps {
    sessions: Session[];
    children?: React.ReactNode;
}

export function SessionCalendarView({ sessions }: SessionCalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [userCountry, setUserCountry] = useState<string | null>("India");

    useEffect(() => {
        const fetchUser = async () => {
            const { data: session } = await authClient.getSession();
            if (session?.user) {
                setUserCountry((session.user as any).country || "India");
            }
        };
        fetchUser();
    }, []);

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    const sessionsByDay = (date: Date) => {
        return sessions.filter(session => isSameDay(new Date(session.scheduledAt), date));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                {/* Header Controls */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary" /> 
                            Session Schedule
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h4 className="text-sm font-semibold w-40 text-center">
                            {format(startDate, "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
                        </h4>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Week Grid */}
                <div className="grid grid-cols-7 gap-4">
                    {weekDays.map((day, idx) => {
                        const daySessions = sessionsByDay(day);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div key={idx} className={`min-h-[200px] rounded-xl border ${isToday ? "border-primary/50 bg-primary/5" : "border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/20"} p-3 flex flex-col gap-2`}>
                                <div className="text-center mb-2">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">{format(day, "EEE")}</div>
                                    <div className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>{format(day, "d")}</div>
                                </div>

                                {daySessions.map(session => (
                                    <Link key={session.id} href={`/live-sessions/${session.id}`}>
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm text-xs border border-slate-200 dark:border-gray-700 cursor-pointer hover:border-primary transition-colors group mb-2 last:mb-0"
                                        >
                                            <div className="font-bold truncate text-[#011E21] dark:text-gray-200 group-hover:text-primary">
                                                {session.title}
                                            </div>
                                            <div className="text-gray-500 mt-1 flex items-center justify-between">
                                                <span>{format(new Date(session.scheduledAt), "h:mm a")}</span>
                                                <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4">
                                                    {formatPriceSimple(session.price / 100, userCountry)}
                                                </Badge>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}

                                {daySessions.length === 0 && (
                                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400 dark:text-gray-700 font-medium">
                                        No sessions
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
