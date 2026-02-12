"use client";

import { motion } from "framer-motion";
import { Star, Users, Clock, Award, PlayCircle, MessageCircle, Calendar } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket

interface InteractiveMentorCardProps {
    name: string;
    role: string;
    company?: string;
    rating: number;
    reviews: number;
    students: string;
    experience: string;
    skills: string[];
    hourlyRate: number;
    image: string;
    featured?: boolean;
    isOnline?: boolean;
}

export function InteractiveMentorCard({
    name, role, company, rating, reviews, students, experience, skills, hourlyRate, image, featured, isOnline = true
}: InteractiveMentorCardProps) {
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
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="group relative bg-white dark:bg-[#1A1D21] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 w-full max-w-sm overflow-hidden"
        >
            {/* Featured Badge */}
            {featured && (
                <div className="absolute top-4 left-4 z-20">
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-lg shadow-amber-500/30">Feature Choice</Badge>
                </div>
            )}

            {/* Online Status */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                <span className="text-[10px] font-bold text-white tracking-wide">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            {/* Video Preview Overlay (Hover) */}
            <div className="absolute inset-0 z-10 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/40 mb-3 mx-auto"
                    >
                        <PlayCircle className="w-8 h-8 ml-1" />
                    </motion.button>
                    <p className="text-white font-bold text-sm tracking-wide">Watch Intro</p>
                    <p className="text-white/60 text-xs">1m 20s</p>
                </div>
                
                {/* Bottom Quick Actions */}
                <div className="absolute bottom-0 inset-x-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
                    <button className="flex-1 bg-white text-black py-2.5 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Chat
                    </button>
                    <button className="flex-1 bg-primary text-white py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Book
                    </button>
                </div>
            </div>

            {/* Image Container */}
            <div className="relative h-[280px] w-full bg-gray-100 dark:bg-gray-800">
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Overlay Content */}
                <div className="absolute bottom-4 left-4 right-4 text-white z-0 group-hover:opacity-0 transition-opacity duration-300">
                    <h3 className="text-xl font-bold truncate">{name}</h3>
                    <p className="text-white/80 text-sm truncate">{role} {company && `at ${company}`}</p>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium text-white/90">
                        <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{rating}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/40" />
                        <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{students} students</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Content (Visible Below Image) */}
            <div className="p-5 space-y-4">
                {/* Skills Chips */}
                <div className="flex flex-wrap gap-2 h-[52px] overflow-hidden">
                    {skills.slice(0, 3).map((skill, i) => (
                        <span 
                            key={i} 
                            className="text-xs font-medium px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10"
                        >
                            {skill}
                        </span>
                    ))}
                    {skills.length > 3 && (
                        <span className="text-xs font-medium px-2 py-1 text-gray-400">+{skills.length - 3}</span>
                    )}
                </div>

                <div className="h-px bg-gray-100 dark:bg-white/5 w-full my-4" />

                {/* Footer Stats */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Rate</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-foreground">
                                {formatPriceSimple(hourlyRate, userCountry)}
                            </span>
                            <span className="text-xs text-muted-foreground">/hr</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                       <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Exp.</span>
                       <span className="text-sm font-bold text-foreground flex items-center gap-1">
                           <Award className="w-3.5 h-3.5 text-primary" />
                           {experience}
                       </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
