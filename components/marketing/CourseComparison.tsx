"use client";

import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
import { useEffect } from "react";

// -- Types --
export type CompressibleCourse = {
    id: string;
    title: string;
    price: number;
    rating: number; // mock or real
    level: string;
    duration: number;
    image: string;
    category?: string;
};

// -- Context --
interface ComparisonContextType {
    selectedCourses: CompressibleCourse[];
    toggleCourse: (course: CompressibleCourse) => void;
    clearSelection: () => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    userCountry: string | null;
}

const ComparisonContext = createContext<ComparisonContextType | null>(null);

export function useComparison() {
    const context = useContext(ComparisonContext);
    if (!context) throw new Error("useComparison must be used within a CourseComparisonProvider");
    return context;
}

// -- Provider --
export function CourseComparisonProvider({ children }: { children: React.ReactNode }) {
    const [selectedCourses, setSelectedCourses] = useState<CompressibleCourse[]>([]);
    const [isOpen, setIsOpen] = useState(false);
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

    const toggleCourse = (course: CompressibleCourse) => {
        if (selectedCourses.find(c => c.id === course.id)) {
            setSelectedCourses(prev => prev.filter(c => c.id !== course.id));
        } else {
            if (selectedCourses.length >= 3) {
                // Toast warning ideally
                return;
            }
            setSelectedCourses(prev => [...prev, course]);
        }
    };

    const clearSelection = () => setSelectedCourses([]);

    return (
        <ComparisonContext.Provider value={{ selectedCourses, toggleCourse, clearSelection, isOpen, setIsOpen, userCountry }}>
            {children}
            <FloatingCompareBar />
            <ComparisonModal />
        </ComparisonContext.Provider>
    );
}

// -- Components --

export function CompareCheckbox({ course }: { course: CompressibleCourse }) {
    const { selectedCourses, toggleCourse } = useComparison();
    const isSelected = !!selectedCourses.find(c => c.id === course.id);

    return (
        <div
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCourse(course); }}
            className={`cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border backdrop-blur-sm z-20 ${isSelected
                ? "bg-primary text-white border-primary shadow-md"
                : "bg-white/80 dark:bg-black/50 hover:bg-white text-muted-foreground border-gray-200 dark:border-gray-700"}`}
        >
            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${isSelected ? "border-white bg-white/20" : "border-gray-400 group-hover:border-primary"}`}>
                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            Compare
        </div>
    );
}

function FloatingCompareBar() {
    const { selectedCourses, clearSelection, setIsOpen } = useComparison();

    if (selectedCourses.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#011E21] text-white p-3 rounded-2xl shadow-2xl z-50 flex items-center gap-6 max-w-[90vw] md:max-w-xl border border-gray-700/50"
            >
                <div className="flex items-center gap-3 pl-2">
                    <span className="bg-primary text-white text-xs font-black rounded-md px-2 py-1">{selectedCourses.length}</span>
                    <span className="text-sm font-medium hidden sm:inline">Selected for comparison</span>
                </div>

                <div className="flex -space-x-3 hidden sm:flex">
                    {selectedCourses.map(c => (
                        <div key={c.id} className="w-8 h-8 rounded-full border-2 border-[#011E21] relative overflow-hidden bg-gray-700">
                            <Image src={c.image} alt={c.title} fill className="object-cover" />
                        </div>
                    ))}
                </div>

                <div className="h-6 w-px bg-gray-700 mx-2" />

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-300 hover:text-white hover:bg-transparent px-2"
                        onClick={clearSelection}
                    >
                        Clear
                    </Button>
                    <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl"
                        onClick={() => setIsOpen(true)}
                        disabled={selectedCourses.length < 2}
                    >
                        Compare Now
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function ComparisonModal() {
    const { isOpen, setIsOpen, selectedCourses, userCountry } = useComparison();

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl bg-white dark:bg-[#0c1220]">
                <DialogHeader>
                    <DialogTitle>Compare Courses</DialogTitle>
                    <DialogDescription>Side-by-side comparison of your selected courses</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {selectedCourses.map(course => (
                        <div key={course.id} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-gray-50/50 dark:bg-card">
                            <div className="relative h-32 w-full mb-4 rounded-lg overflow-hidden">
                                <Image src={course.image} alt={course.title} fill className="object-cover" />
                            </div>
                            <h3 className="font-bold text-sm mb-2 line-clamp-2 min-h-[40px]">{course.title}</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-2 dark:border-gray-800">
                                    <span className="text-muted-foreground">Price</span>
                                    <span className="font-bold">{course.price === 0 ? "Free" : formatPriceSimple(course.price / 100, userCountry)}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2 dark:border-gray-800">
                                    <span className="text-muted-foreground">Level</span>
                                    <span>{course.level}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2 dark:border-gray-800">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span>{Math.round(course.duration / 60)} hours</span>
                                </div>
                                <div className="flex justify-between border-b pb-2 dark:border-gray-800">
                                    <span className="text-muted-foreground">Certificate</span>
                                    <span className="text-green-600 font-bold text-xs"><Check className="w-3 h-3 inline" /> Included</span>
                                </div>
                            </div>
                            <Button className="w-full mt-4 font-bold">Enroll Now</Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
