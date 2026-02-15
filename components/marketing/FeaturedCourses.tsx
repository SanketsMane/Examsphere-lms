"use client";

import { motion } from "framer-motion";
import { Star, Clock, BookOpen, ChevronRight, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
import { useCurrency } from "@/components/providers/CurrencyProvider";

// Helper type for the data structure we receive
interface FeaturedCourse {
    id: string;
    title: string;
    slug: string;
    description: string;
    fileKey: string; // Used as image URL
    price: number;
    duration: number; // in minutes
    level: string;
    categoryModel: {
        name: string;
    } | null;
    user: {
        name: string;
        image: string | null;
        teacherProfile: {
            rating: number | null;
            totalReviews: number;
        } | null;
    };
    reviews: { rating: number }[];
    averageRating: number | null;
    totalReviews: number;
    _count: {
        lessons: number; // Actually chapters/lessons mapping needs care, assuming chapters -> lessons or direct lessons relation if modified, but standard schema has Course -> Chapter -> Lesson. 
        // The fetcher used _count: { lessons: true } which works if there is a direct relation.
        // If no direct relation, we should have fetched chapters and counted lessons.
        // For now, let's display lecture count if available or default.
    } | any;
}

interface FeaturedCoursesProps {
    courses: FeaturedCourse[];
}

export function FeaturedCourses({ courses }: FeaturedCoursesProps) {
    const { rates } = useCurrency();
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

    if (!courses || courses.length === 0) {
        return null; // Or return a "Coming Soon" placeholder
    }

    return (
        <section className="py-24 bg-gray-50/50 dark:bg-background border-t border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#011E21] dark:text-white mb-8">
                        The world's best online courses at one place
                    </h2>
                </div>

                {/* Grid */}
                <div className="relative">
                    {/* Arrow Buttons (Visual only for now) */}
                    <button suppressHydrationWarning className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-card border border-gray-100 dark:border-gray-800 rounded-full shadow-lg flex items-center justify-center z-10 hover:scale-110 transition-transform hidden lg:flex">
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button suppressHydrationWarning className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 bg-[#4FB5C6] rounded-full shadow-lg flex items-center justify-center z-10 hover:scale-110 transition-transform hidden lg:flex">
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {courses.map((course, idx) => {
                            // Calculate display values
                            const rating = course.averageRating || 4.5;
                            const reviewCount = course.totalReviews || 0;
                            const hours = Math.floor(course.duration / 60);
                            const minutes = course.duration % 60;
                            const durationStr = `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;

                            // Image: use fileKey if it looks like a URL, else fallback
                            const imageUrl = course.fileKey && course.fileKey.startsWith('http')
                                ? course.fileKey
                                : '/placeholder-course.jpg'; // Need a real placeholder or just use the random ones from before if missing? 
                            // Ideally seed data has valid URLs.

                            const instructorName = course.user.name || "Instructor";
                            const instructorAvatar = course.user.image || "https://github.com/shadcn.png";

                            return (
                                <Link href={`/courses/${course.slug}`} key={course.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                                        className="bg-white dark:bg-card rounded-[2rem] p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all group h-full cursor-pointer"
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-[16/10] rounded-[1.5rem] overflow-hidden mb-4 bg-gray-200">
                                            <Image
                                                src={imageUrl}
                                                alt={course.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            {/* Overlay Gradient */}
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                                        </div>

                                        {/* Content */}
                                        <div className="px-1 space-y-3">
                                            <div className="flex items-center gap-1 text-blue-400 text-xs font-bold">
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <span>{rating.toFixed(1)}</span>
                                                <span className="text-gray-400 font-normal">({reviewCount})</span>
                                            </div>

                                            <h3 className="font-bold text-[#011E21] dark:text-white text-lg leading-snug line-clamp-2 h-[3.2em]">
                                                {course.title}
                                            </h3>

                                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    {durationStr}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <BookOpen className="w-4 h-4" />
                                                    <span>{course.categoryModel?.name || "General"}</span>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                                <span className="text-xl font-bold text-[#011E21] dark:text-white">
                                                    {formatPriceSimple(course.price, userCountry, rates)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1">
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-100">
                                                    <Image src={instructorAvatar} alt={instructorName} fill className="object-cover" />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                                                    {instructorName}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="text-center mt-12">
                    <Link href="/courses">
                        <button suppressHydrationWarning className="bg-[#4FB5C6] hover:bg-[#3da3b4] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-cyan-200/50 transition-all hover:scale-105">
                            View All Courses
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

