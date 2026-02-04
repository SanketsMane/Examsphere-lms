"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users, ArrowRight, Video } from "lucide-react";

interface SessionCardProps {
    id: string;
    title: string;
    instructor: string;
    date: string;
    time: string;
    duration: string;
    participants: number;
    maxParticipants: number;
    level: string;
    price: string;
    rating: number;
    index: number;
}

export function SessionCard({
    id,
    title,
    instructor,
    date,
    time,
    duration,
    participants,
    maxParticipants,
    level,
    price,
    rating,
    index,
}: SessionCardProps) {

    const isAvailable = participants < maxParticipants;
    const levelColor =
        level === "Beginner" || level === "Upcoming" || level === "Active" ? "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" :
            level === "Intermediate" || level === "Ongoing" ? "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" :
                "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden bg-white dark:bg-card border border-slate-200 dark:border-gray-800 rounded-[2rem] hover:shadow-xl transition-all duration-300 flex flex-col h-full p-4"
        >
            <CardContent className="p-4 flex flex-col gap-4 flex-1">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                    <Badge variant="outline" className={`${levelColor} border-0 font-semibold px-2.5 py-0.5 rounded-full`}>
                        {level}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm font-medium text-amber-500">
                        <span>★ {rating}</span>
                    </div>
                </div>

                {/* Title */}
                <div>
                    <h3 className="text-xl font-bold text-[#011E21] dark:text-white leading-tight group-hover:text-primary transition-colors mb-2">
                        {title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
                            {instructor.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">by {instructor}</span>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200 dark:border-gray-800">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200 dark:border-gray-800">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{time}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200 dark:border-gray-800">
                        <Video className="w-4 h-4 text-primary" />
                        <span>{duration}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200 dark:border-gray-800">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{participants}/{maxParticipants}</span>
                    </div>
                </div>
            </CardContent>

            <div className="p-4 pt-0 mt-auto">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-gray-800/50">
                    <div className="flex flex-col">
                        <span className="text-xl font-extrabold text-[#011E21] dark:text-white">{price}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Per Session</span>
                    </div>

                    <Link
                        href={`/live-sessions/${id}`}
                        className={`
                    inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm
                    ${isAvailable
                                ? 'bg-[#011E21] dark:bg-white text-white dark:text-black hover:bg-primary hover:text-white'
                                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-80'}
                `}
                    >
                        {isAvailable ? (
                            <>
                                Book
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        ) : (
                            'Full'
                        )}
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
