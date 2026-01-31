"use client";

import { motion } from "framer-motion";
import { User, MessageCircle, Users, Star } from "lucide-react";
import Image from "next/image";

const features = [
    {
        icon: User,
        title: "Professional Tutors",
        description: "Choose from over a myriad of professional & experienced teachers to be fluent in any language.",
        color: "bg-blue-500",
        visual: (
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 transform group-hover:scale-105 transition-transform duration-500">
                <Image 
                    src="/images/marketing/tutors.png" 
                    alt="Professional Tutors" 
                    fill 
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
        )
    },
    {
        icon: MessageCircle,
        title: "1-on-1 Live sessions",
        description: "Connect with your teachers via 1-on-1 live chat sessions and build a deeper understanding of a language.",
        color: "bg-teal-500",
        visual: (
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 transform group-hover:scale-105 transition-transform duration-500">
                <Image 
                    src="/images/marketing/live-sessions.png" 
                    alt="1-on-1 Live sessions" 
                    fill 
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
        )
    },
    {
        icon: Users,
        title: "Group Classes",
        description: "Choose from over a myriad of professional & experienced teachers to be fluent in any language.",
        color: "bg-rose-500",
        visual: (
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 transform group-hover:scale-105 transition-transform duration-500">
                <Image 
                    src="/images/marketing/group-classes.png" 
                    alt="Group Classes" 
                    fill 
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
        )
    },
];

export function FeaturesGrid() {
    return (
        <section className="py-24 bg-white dark:bg-background border-b border-border/40">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#011E21] dark:text-white mb-6">
                        We Make Language Learning Easy & Simpler
                    </h2>
                    <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                </div>

                <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: -50 }} // Changed from 30 to -50 for "up to down"
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: idx * 0.2, ease: "easeOut" }}
                            className="group flex flex-col items-center text-center"
                        >
                            <div className="bg-white dark:bg-card p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 w-full h-full hover:shadow-2xl transition-all duration-300">
                                {/* Visual Container - Added padding and centered content to avoid clipping */}
                                <div className="w-full aspect-[4/3] mb-6 relative flex items-center justify-center p-4">
                                    {feature.visual}
                                </div>

                                <h3 className="text-2xl font-bold text-[#011E21] dark:text-white mb-3">
                                    {feature.title}
                                </h3>

                                <p className="text-muted-foreground leading-relaxed dark:text-slate-400">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
