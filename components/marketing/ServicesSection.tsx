"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const tabs = [
    {
        id: "courses",
        label: "Online Courses",
        title: "We have best online courses at one place with expert tutors",
        features: [
            "Certificate Available along-with courses.",
            "Full Practice Exam with Explanations included!",
            "Downloadable Assets available in the course",
            "24x7 teacher's support available",
        ],
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop", // Student with laptop
        color: "bg-rose-500",
        link: "/courses"
    },
    {
        id: "live",
        label: "1-on-1 Live Session",
        title: "Personalized learning with dedicated expert tutors",
        features: [
            "Real-time interaction with instructors",
            "Customized curriculum to fit your needs",
            "Instant feedback and doubt resolution",
            "Flexible scheduling options",
        ],
        image: "https://images.unsplash.com/photo-1590650046871-92c887180603?q=80&w=2070&auto=format&fit=crop", // Video call
        color: "bg-blue-500",
        link: "/find-teacher"
    },
    {
        id: "group",
        label: "Group Classes",
        title: "Collaborative learning in small, focused groups",
        features: [
            "Learn with peers and share knowledge",
            "Cost-effective alternative to 1-on-1",
            "Interactive group activities",
            "Regular scheduled sessions",
        ],
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop", // Group study
        color: "bg-amber-500",
        link: "/live-sessions"
    },
];

export function ServicesSection() {
    const [activeTab, setActiveTab] = useState(tabs[0].id);

    const activeContent = tabs.find((t) => t.id === activeTab) || tabs[0];

    return (
        <section className="py-24 bg-[#F5F9FA] dark:bg-black/20 overflow-hidden border-t border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-[#011E21] dark:text-white mb-8">
                        Services we Offer
                    </h2>

                    {/* Magnetic Tabs */}
                    <div className="inline-flex p-1.5 bg-secondary/50 dark:bg-white/5 rounded-full relative backdrop-blur-sm">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                suppressHydrationWarning
                                className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 z-10 ${activeTab === tab.id ? "text-white" : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                                    }`}
                            >
                                {activeTab === tab.id && (
                                    <motion.span
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-[#011E21] dark:bg-primary rounded-full -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-6 md:p-10 border border-gray-100 dark:border-gray-800/50 shadow-sm">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="grid md:grid-cols-2 gap-8 items-center"
                            >
                                {/* Visual Side with 3D Tilt */}
                                <div className="relative group perspective-1000">
                                    {/* Cyan Blob Background */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-[#4FB5C6] dark:bg-primary/20 rounded-[2rem] -rotate-6 transform transition-transform group-hover:rotate-0 duration-700 opacity-20 dark:opacity-40" />

                                    <motion.div
                                        initial={{ rotateY: 0 }}
                                        whileHover={{ rotateY: 2, rotateX: -2 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className="relative z-10"
                                    >
                                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                                            <Image
                                                src={activeContent.image}
                                                alt={activeContent.label}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                                            />
                                        </div>

                                        {/* Badge: Flexible Timings */}
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="absolute top-6 -right-3 bg-white dark:bg-card px-3 py-1.5 rounded-lg shadow-lg border border-pink-100 dark:border-pink-900/30 flex items-center gap-1.5"
                                        >
                                            <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wide">Flexible Timings</span>
                                        </motion.div>

                                        {/* Badge: Individual Tracking */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="absolute -bottom-4 left-6 bg-white dark:bg-card p-2.5 rounded-xl shadow-xl flex items-center gap-2 max-w-[160px] border border-gray-100 dark:border-gray-800"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white shadow-md">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-pink-600 dark:text-pink-400 leading-tight">Individual<br />Tracking</p>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                </div>

                                {/* Content Side */}
                                <div>
                                    <h3 className="text-2xl font-bold mb-4 leading-tight text-[#011E21] dark:text-white">
                                        {activeContent.title}
                                    </h3>

                                    <ul className="space-y-3 mb-6">
                                        {activeContent.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5">
                                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                                <span className="text-base text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button size="lg" className="rounded-full px-6 h-11 text-sm font-bold bg-[#4FB5C6] hover:bg-[#3ca0b0] text-white" asChild>
                                        <Link href={(activeContent as any).link || "/"}>
                                            View All {activeContent.label.split(' ')[0]} <ArrowRight className="ml-2 w-4 h-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section >
    );
}
