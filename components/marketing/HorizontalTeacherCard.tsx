"use client";

import { QuickBookDrawer } from "./QuickBookDrawer";
import { IconStarFilled, IconMapPin, IconMessageCircle, IconVideo, IconShieldCheck, IconCalendar, IconClock, IconHeart, IconShare } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { constructS3Url } from "@/lib/s3-helper";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket

interface TeacherCardProps {
    teacher: {
        id: string;
        name: string;
        image: string;
        headline: string;
        rating: number;
        reviewCount: number;
        hourlyRate: number;
        teaches: string[];
        speaks: string[];
        description: string;
        country: string;
        gender: string;
        experience: number;
        isVerified: boolean;
        availability?: Record<string, string[]> | object;
    };
    currency?: { code: string; symbol: string; factor: number };
}

// Author: Sanket
export function HorizontalTeacherCard({ teacher }: TeacherCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
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

    // Mock availability data
    const nextAvailableSlots = teacher.availability
        ? Object.entries(teacher.availability as Record<string, string[]>).flatMap(([day, slots]) =>
            slots.map(slot => `${day.charAt(0).toUpperCase() + day.slice(1)} ${slot}`)
        ).slice(0, 3)
        : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
            onHoverStart={() => setIsExpanded(true)}
            onHoverEnd={() => setIsExpanded(false)}
            className="group relative flex flex-col md:flex-row bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
        >
            {/* Left: Profile Image Section */}
            <div className="relative w-full md:w-64 p-4 flex flex-col items-center bg-gray-50/50 dark:bg-slate-900/50 border-r border-gray-100 dark:border-gray-800">
                <div className="relative w-full aspect-[4/3] mb-4">
                    <div className="w-full h-full rounded-lg overflow-hidden shadow-sm relative">
                        <Image
                            src={constructS3Url(teacher.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=random&color=fff&size=128`}
                            alt={teacher.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            className="object-cover"
                        />

                        {/* Video Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                            <IconVideo className="h-10 w-10 text-white drop-shadow-md" />
                        </div>
                    </div>

                    {teacher.isVerified && (
                        <div className="absolute -top-2 -right-2 bg-white dark:bg-[#1e293b] rounded-full p-1 shadow-sm border border-gray-100 dark:border-gray-800" title="Verified Expert">
                            <IconShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    )}
                </div>

                <div className="text-center w-full">
                    <h3 className="font-bold text-lg leading-tight mb-1 text-slate-800 dark:text-slate-100 truncate px-1">
                        {teacher.name}
                    </h3>

                    <div className="flex items-center justify-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-3">
                        <IconMapPin className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[150px]">{teacher.country}</span>
                    </div>

                    <div className="flex items-center justify-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-3 py-1 rounded-full text-sm font-medium border border-amber-100 dark:border-amber-900/30 dark:text-amber-400">
                        <IconStarFilled className="h-3.5 w-3.5" />
                        <span>{teacher.rating.toFixed(1)}</span>
                        <span className="text-slate-400 font-normal ml-0.5">({teacher.reviewCount})</span>
                    </div>
                </div>
            </div>

            {/* Middle: Info Section */}
            <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-blue-700 dark:text-blue-300 line-clamp-1">
                            {teacher.headline}
                        </h4>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
                        {teacher.description}
                    </p>

                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Teaches:</span>
                            {teacher.teaches.map((lang, idx) => (
                                <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-100 dark:border-blue-800 rounded px-2 py-0.5 font-medium"
                                >
                                    {lang}
                                </Badge>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Experience:</span>
                            <span className="text-slate-600 dark:text-slate-400">
                                {teacher.experience} Years
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Speaks:</span>
                            <span className="text-slate-600 dark:text-slate-400">
                                {teacher.speaks.join(" • ")}
                            </span>
                        </div>
                    </div>

                    {/* Expandable Availability Section */}
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 overflow-hidden"
                        >
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <IconCalendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                                        Next Available Slots
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    {nextAvailableSlots.length > 0 ? (
                                        nextAvailableSlots.map((slot, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                <span>{slot}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-slate-500 italic">
                                            Contact instructor for availability
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Right: Action Section */}
            <div className="w-full md:w-56 p-5 border-l border-gray-100 dark:border-gray-800 flex flex-col justify-center items-center gap-3 bg-gray-50/10">
                <div className="text-center mb-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hourly Rate</p>
                    <div className="text-3xl font-bold text-slate-800 dark:text-white">
                        {formatPriceSimple(teacher.hourlyRate, userCountry)}
                    </div>
                    <p className="text-[10px] text-slate-400">per session</p>
                </div>

                <div className="w-full space-y-2">
                    <QuickBookDrawer
                        teacher={teacher}
                        trigger={
                            <Button className="w-full font-semibold shadow-sm bg-blue-600 hover:bg-blue-700 text-white">
                                Book Now
                            </Button>
                        }
                    />
                    <Link href={`/teachers/profile/${teacher.id}`} className="block w-full">
                        <Button
                            variant="outline"
                            className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            View Profile
                        </Button>
                    </Link>

                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFavorited(!isFavorited)}
                            className="flex-1 h-9 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                            <IconHeart className={`h-4 w-4 ${isFavorited ? "fill-rose-500 text-rose-500" : ""}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-9 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                            <IconMessageCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
