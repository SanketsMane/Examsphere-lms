"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { User, Calendar, Clock, Sparkles, Users, ArrowRight, Ticket } from "lucide-react";
import { requestToJoinGroup } from "@/app/actions/groups";
import { toast } from "sonner";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface PackageProps {
    packages: any[];
    currency?: { code: string; symbol: string; factor: number };
}

export function PackagesList({ 
    packages, 
    currency = { code: "USD", symbol: "$", factor: 1 } 
}: PackageProps) {
    const [joiningId, setJoiningId] = useState<string | null>(null);

    if (packages.length === 0) return null;

    return (
        <div className="space-y-8 mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3 border border-blue-100 dark:border-blue-800">
                        <Sparkles className="w-3 h-3" />
                        Interactive Learning
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Featured Group <span className="text-blue-600 dark:text-blue-400">Classes & Packages</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
                        Join collaborative sessions led by expert mentors. Learn with peers and fast-track your skills.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {packages.map((pkg, index) => {
                    const priceInLocal = (pkg.price || 0) * currency.factor;
                    const seatsEnrolled = pkg.enrollments?.length || 0;
                    const seatsLeft = Math.max(0, (pkg.maxStudents || 12) - seatsEnrolled);
                    const isFull = seatsLeft <= 0;

                    return (
                        <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="group overflow-hidden flex flex-col h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border-b-4 border-b-blue-500/50">
                                {/* Banner / Header Image */}
                                {pkg.bannerUrl ? (
                                    <div className="relative h-44 w-full overflow-hidden">
                                        <Image
                                            src={pkg.bannerUrl}
                                            alt={pkg.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                                        
                                        {/* Status Badge */}
                                        <div className="absolute top-4 right-4">
                                            <Badge className={isFull ? "bg-rose-500" : "bg-emerald-500"}>
                                                {isFull ? "Full" : `${seatsLeft} Seats Left`}
                                            </Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-44 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
                                        <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
                                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                            <div className="flex justify-between items-center text-white/90 text-xs font-bold uppercase tracking-wider">
                                                <span>{pkg.level || "Beginner"}</span>
                                                <span>{pkg.language || "English"}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="absolute top-4 right-4">
                                            <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                                                {isFull ? "Full" : `${seatsLeft} Seats Left`}
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start gap-4">
                                        <CardTitle className="text-xl font-bold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[3.5rem]">
                                            {pkg.title}
                                        </CardTitle>
                                        <div className="text-right shrink-0">
                                            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-tight">
                                                {currency.symbol}{Math.round(priceInLocal)}
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Per Participant</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="relative w-6 h-6 rounded-full overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800">
                                            <Image 
                                                src={pkg.teacher.user.image || `https://ui-avatars.com/api/?name=${pkg.teacher.user.name}`}
                                                alt={pkg.teacher.user.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {pkg.teacher.user.name}
                                        </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 h-10">
                                        {pkg.description || "Learn fundamental concepts in this interactive group session."}
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                            {formatDate(pkg.scheduledAt)}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                                            {pkg.duration} mins
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                            <Users className="h-3.5 w-3.5 text-blue-500" />
                                            {seatsEnrolled}/{pkg.maxStudents || 12} Students
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                            {pkg.subject || "General"}
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="flex-col gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="w-full relative group/coupon">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <Ticket className="w-4 h-4 text-slate-400 group-focus-within/coupon:text-blue-500 transition-colors" />
                                        </div>
                                        <Input 
                                            id={`coupon-${pkg.id}`}
                                            placeholder="COUPON CODE (OPTIONAL)"
                                            className="h-10 pl-10 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-xs font-bold tracking-widest placeholder:tracking-normal focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all uppercase"
                                        />
                                    </div>
                                    
                                    <Button 
                                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all gap-2"
                                        disabled={isFull || joiningId === pkg.id}
                                        onClick={async () => {
                                            setJoiningId(pkg.id);
                                            try {
                                                const couponInput = document.getElementById(`coupon-${pkg.id}`) as HTMLInputElement;
                                                const result = await (requestToJoinGroup as any)(pkg.id, couponInput?.value);
                                                if (result.success) {
                                                    toast.success("Spot Reserved!", { 
                                                        description: "Teacher will review and confirm your request shortly." 
                                                    });
                                                } else {
                                                    toast.error(result.error || "Failed to join class");
                                                }
                                            } finally {
                                                setJoiningId(null);
                                            }
                                        }}
                                    >
                                        {joiningId === pkg.id ? (
                                            "Processing..."
                                        ) : isFull ? (
                                            "Class Full"
                                        ) : (
                                            <>
                                                Join Class <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
