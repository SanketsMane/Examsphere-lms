"use client";

import { motion } from "framer-motion";
import { Video, Shield, MessageSquare } from "lucide-react";

const benefitFeatures = [
    {
        icon: Video,
        title: "HD Video Quality",
        desc: "Crystal clear video for immersive learning"
    },
    {
        icon: MessageSquare,
        title: "Real-time Q&A",
        desc: "Get your doubts resolved instantly"
    },
    {
        icon: Shield,
        title: "Approved Mentors",
        desc: "Sessions are run by mentors approved by ExamSphere"
    }
];

export function LiveSessionFeatures() {
    return (
        <section className="py-16 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-6">
                    {benefitFeatures.map((feat, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-card hover:shadow-lg transition-all"
                        >
                            <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                                <feat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#011E21] dark:text-white mb-1">{feat.title}</h3>
                                <p className="text-sm text-muted-foreground leading-snug">{feat.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
