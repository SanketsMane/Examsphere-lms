import type { Metadata } from "next";
import { withSocial } from "@/lib/seo-metadata";

export const metadata: Metadata = withSocial({
    alternates: { canonical: "/terms" },
    title: "Terms of Service | ExamSphere",
    description: "The terms that apply when you use ExamSphere's JEE, NEET, Foundation and MBBS courses and services.",
});

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <div className="prose dark:prose-invert">
                <p>Last updated: January 2026</p>
                <p>Please read these Terms of Service carefully before using ExamSphere.</p>

                <h2>1. Acceptance of Terms</h2>
                <p>By accessing or using our platform, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>

                <h2>2. Use License</h2>
                <p>Permission is granted to temporarily download one copy of the materials (information or software) on ExamSphere&apos;s website for personal, non-commercial transitory viewing only.</p>

                <h2>3. Disclaimer</h2>
                <p>The materials on ExamSphere&apos;s website are provided on an &apos;as is&apos; basis. ExamSphere makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.</p>            </div>
        </div>
    );
}
