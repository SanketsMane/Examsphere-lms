"use client";

import { motion } from "framer-motion";
import { Users, Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export interface LiveSessionMock {
    id: string;
    title: string;
    instructor: string;
    image: string;
    viewers: number;
    topic: string;
}

interface LiveNowTrayProps {
    sessions: LiveSessionMock[];
}

export function LiveNowTray({ sessions }: LiveNowTrayProps) {
    if (!sessions || sessions.length === 0) return null;

    return (
        <div className="bg-[#011E21] text-white overflow-hidden relative">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full text-xs font-bold animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full" />
                        LIVE NOW
                    </div>
                    <span className="text-sm text-gray-400 hidden md:inline">Happening right now on EXAMSPHERE</span>
                </div>

                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar mask-gradient">
                    {sessions.map((session) => (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg border border-white/5 transition-colors cursor-pointer min-w-[280px]"
                        >
                            <div className="relative">
                                <Image
                                    src={session.image}
                                    alt={session.instructor}
                                    width={32}
                                    height={32}
                                    className="rounded-full border border-white/20"
                                />
                                <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-[#011E21]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate w-full">{session.title}</div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {session.viewers} watching
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-transparent">
                                <Play className="w-3 h-3 fill-current" />
                            </Button>
                        </motion.div>
                    ))}
                </div>

                <Link href="#upcoming" className="hidden lg:flex text-xs font-bold items-center gap-1 text-primary hover:text-white transition-colors">
                    View All <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
