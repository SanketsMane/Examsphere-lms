"use client";

import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { PublicCourseCard } from "@/app/(public)/_components/PublicCourseCard";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";

interface Props {
    courses: PublicCourseType[];
    userCountry?: string | null; // Added for localization - Author: Sanket
}

export function AnimatedCoursesGrid({ courses, userCountry }: Props) {
    if (courses.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                <div className="bg-secondary/50 p-4 rounded-full mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    No courses found
                </h3>
                <p className="max-w-md mx-auto mb-6">
                    We couldn't find any courses matching your criteria. Try adjusting your filters or search terms.
                </p>
                <Link
                    href="/courses"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                >
                    Clear Filters
                </Link>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1
                    }
                }
            }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
            {courses.map((course) => (
                <PublicCourseCard key={course.id} data={course} userCountry={userCountry} />
            ))}
        </motion.div>
    );
}
