"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// --- Helper Components & Data ---

// All text data and images are the updated versions (Indian Persons).
const testimonials = [
    {
        quote:
            "This platform revolutionized our learning process. The quality of tutors is unmatched. Highly recommended!",
        name: "Priya Sharma",
        designation: "Student at IIT Bombay",
        src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        quote:
            "Finding a good math tutor was a struggle until I found ExamSphere. The interactive sessions are a game changer.",
        name: "Rahul Verma",
        designation: "Parent",
        src: "https://images.unsplash.com/photo-1566492031776-63065f0ad4c6?q=80&w=2070&auto=format&fit=crop",
    },
    {
        quote:
            "As a teacher, this platform gives me the flexibility I need while connecting me with eager students.",
        name: "Anjali Gupta",
        designation: "Senior Mathematics Tutor",
        src: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=1894&auto=format&fit=crop",
    },
    {
        quote:
            "The curriculum is well-structured and aligns perfectly with my school syllabus. My grades have improved significantly.",
        name: "Arjun Patel",
        designation: "Grade 10 Student",
        src: "https://images.unsplash.com/photo-1507537297725-24a1c434b6b8?q=80&w=2070&auto=format&fit=crop",
    },
    {
        quote:
            "Excellent support team and a very user-friendly interface. My daughter loves her coding classes!",
        name: "Meera Reddy",
        designation: "Parent",
        src: "https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?q=80&w=1770&auto=format&fit=crop",
    },
];

type Testimonial = {
    quote: string;
    name: string;
    designation: string;
    src: string;
};

// --- Main Animated Testimonials Component ---
// This is the core component that handles the animation and logic.
export const AnimatedTestimonials = ({
    testimonials,
    autoplay = true,
}: {
    testimonials: Testimonial[];
    autoplay?: boolean;
}) => {
    const [active, setActive] = useState(0);

    const handleNext = React.useCallback(() => {
        setActive((prev) => (prev + 1) % testimonials.length);
    }, [testimonials.length]);

    const handlePrev = () => {
        setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    useEffect(() => {
        if (!autoplay) return;
        const interval = setInterval(handleNext, 5000);
        return () => clearInterval(interval);
    }, [autoplay, handleNext]);

    const isActive = (index: number) => index === active;

    const randomRotate = () => Math.floor(Math.random() * 21) - 10;

    return (
        <div className="mx-auto max-w-sm px-4 py-20 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
            <div className="relative grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-20">
                {/* Image Section */}
                <div className="flex items-center justify-center">
                    <div className="relative h-80 w-full max-w-xs">
                        <AnimatePresence>
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={testimonial.src}
                                    initial={{ opacity: 0, scale: 0.9, z: -100, rotate: randomRotate() }}
                                    animate={{
                                        opacity: isActive(index) ? 1 : 0.7,
                                        scale: isActive(index) ? 1 : 0.95,
                                        z: isActive(index) ? 0 : -100,
                                        zIndex: isActive(index) ? 999 : testimonials.length + 2 - index,
                                        y: isActive(index) ? [0, -80, 0] : 0,
                                    }}
                                    exit={{ opacity: 0, scale: 0.9, z: 100, rotate: randomRotate() }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="absolute inset-0 origin-bottom"
                                >
                                    <img
                                        src={testimonial.src}
                                        alt={testimonial.name}
                                        width={500}
                                        height={500}
                                        draggable={false}
                                        className="h-full w-full rounded-3xl object-cover object-center shadow-2xl"
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Text and Controls Section */}
                <div className="flex flex-col justify-center py-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                    {testimonials[active].name}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {testimonials[active].designation}
                                </p>
                                <motion.p className="mt-8 text-lg text-slate-700 dark:text-slate-300">
                                    &quot;{testimonials[active].quote}&quot;
                                </motion.p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                    <div className="flex gap-4 pt-12">
                        <button
                            onClick={handlePrev}
                            aria-label="Previous testimonial"
                            className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus:ring-slate-500"
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-800 transition-transform duration-300 group-hover:-translate-x-1 dark:text-slate-300" />
                        </button>
                        <button
                            onClick={handleNext}
                            aria-label="Next testimonial"
                            className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus:ring-slate-500"
                        >
                            <ArrowRight className="h-5 w-5 text-slate-800 transition-transform duration-300 group-hover:translate-x-1 dark:text-slate-300" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Demo Component ---
export function AnimatedTestimonialsDemo() {
    return <AnimatedTestimonials testimonials={testimonials} />;
}
