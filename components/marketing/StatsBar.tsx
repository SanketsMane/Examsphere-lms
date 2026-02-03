"use client";

import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { BookOpen, Users, Award, Globe } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const stats = [
    {
        label: "Total Courses",
        value: 1000,
        suffix: "+",
        icon: BookOpen,
        color: "text-blue-500",
    },
    {
        label: "Active Students",
        value: 6400,
        suffix: "",
        icon: Users,
        color: "text-blue-500",
    },
    {
        label: "Expert Instructors",
        value: 120,
        suffix: "+",
        icon: Award,
        color: "text-blue-500", // The screenshot shows blue for all
    },
    {
        label: "Countries",
        value: 14,
        suffix: "+",
        icon: Globe,
        color: "text-blue-500",
    },
];

function Counter({ value, suffix }: { value: number, suffix: string }) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    useEffect(() => {
        if (isInView) {
            const controls = animate(count, value, { duration: 2.5, ease: "easeOut" });
            return controls.stop;
        }
    }, [isInView, value, count]);

    return (
        <span ref={ref} className="flex items-baseline justify-center">
            <motion.span>{rounded}</motion.span>
            {suffix}
        </span>
    );
}

export function StatsBar() {
    return (
        <section className="bg-white dark:bg-card border-b border-gray-100 dark:border-gray-800">
            <div className="container mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800">
                    {stats.map((stat, idx) => (
                        <div
                            key={idx}
                            className="group py-10 px-4 flex flex-col items-center justify-center text-center hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors cursor-default"
                        >
                            <motion.div
                                initial={{ scale: 1 }}
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className="mb-4"
                            >
                                <stat.icon className={cn("w-8 h-8", stat.color)} />
                            </motion.div>

                            <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                <Counter value={stat.value} suffix={stat.suffix} />
                            </div>

                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
