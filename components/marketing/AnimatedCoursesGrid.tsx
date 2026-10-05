"use client";

import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { PublicCourseCard } from "@/app/(public)/_components/PublicCourseCard";
import { motion } from "framer-motion";
import { MessageCircle, Search, Sparkles } from "lucide-react";
import Link from "next/link";

interface Props {
    courses: PublicCourseType[];
    userCountry?: string | null; // Added for localization - Author: Sanket
    /** Where "Clear Filters" goes when nothing matches. */
    clearHref?: string;
    /**
     * The programme category being browsed. When it has no courses yet we say so and offer an
     * enquiry, instead of implying the visitor's filters are wrong.
     */
    category?: string;
    /** Show the "Ask about this programme" button (needs the public chatbot on the page). */
    showEnquiry?: boolean;
    /** Passed through to each card — see PublicCourseCard. */
    hrefBase?: string;
}

const primaryButton =
    "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors";
const outlineButton =
    "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors";

export function AnimatedCoursesGrid({
    courses,
    userCountry,
    clearHref = "/courses",
    category,
    showEnquiry = true,
    hrefBase,
}: Props) {
    if (courses.length === 0 && category) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    Courses for {category} are opening soon
                </h3>
                <p className="max-w-md mx-auto mb-6">
                    We&apos;re preparing the {category} programme. Ask us about batches and fees, or
                    browse the courses that are already open.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {showEnquiry && (
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new Event("examsphere:open-chat"))}
                            className={primaryButton}
                        >
                            <MessageCircle className="h-4 w-4" />
                            Ask about {category}
                        </button>
                    )}
                    <Link href={clearHref} className={showEnquiry ? outlineButton : primaryButton}>
                        View all courses
                    </Link>
                </div>
            </div>
        );
    }

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
                <Link href={clearHref} className={primaryButton}>
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
                <PublicCourseCard key={course.id} data={course} userCountry={userCountry} hrefBase={hrefBase} />
            ))}
        </motion.div>
    );
}
