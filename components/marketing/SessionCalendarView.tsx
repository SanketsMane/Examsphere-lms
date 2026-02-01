"use client";

import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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

export function SessionCalendarView({ sessions, children }: SessionCalendarViewProps) {
    const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
    const [currentDate, setCurrentDate] = useState(new Date());

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    const sessionsByDay = (date: Date) => {
        return sessions.filter(session => isSameDay(new Date(session.scheduledAt), date));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-primary" /> Session Schedule
                </h3>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode("list")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <List className="w-4 h-4" /> List
                    </button>
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "calendar" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <CalendarIcon className="w-4 h-4" /> Calendar
                    </button>
                </div>
            </div>

            {viewMode === "calendar" && (
                <div className="bg-white dark:bg-card border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    {/* Header Controls */}
                    <div className="flex items-center justify-between mb-8">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h4 className="text-lg font-bold">
                            {format(startDate, "MMMM d")} - {format(weekDays[6], "MMMM d, yyyy")}
                        </h4>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
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
                                        <motion.div
                                            key={session.id}
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm text-xs border border-slate-200 dark:border-gray-700 cursor-pointer hover:border-primary transition-colors group"
                                        >
                                            <div className="font-bold truncate text-[#011E21] dark:text-gray-200 group-hover:text-primary">
                                                {session.title}
                                            </div>
                                            <div className="text-gray-500 mt-1 flex items-center justify-between">
                                                <span>{format(new Date(session.scheduledAt), "h:mm a")}</span>
                                                <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4">₹{session.price / 100}</Badge>
                                            </div>
                                        </motion.div>
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
            )}

            {viewMode === "list" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            )}
        </div>
    );
}
