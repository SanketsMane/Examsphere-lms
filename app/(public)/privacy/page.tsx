import type { Metadata } from "next";
import { getContactDetails } from "@/app/data/settings/get-contact-details";

export const metadata: Metadata = {
    title: "Privacy Policy | ExamSphere",
    description: "How ExamSphere collects, uses and protects the personal information of students, parents and mentors.",
};

export default async function PrivacyPage() {
    const { email } = await getContactDetails();

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <div className="prose dark:prose-invert">
                <p>Last updated: January 2026</p>
                <p>At ExamSphere, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.</p>

                <h2>1. Information We Collect</h2>
                <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us.</p>

                <h2>2. How We Use Your Information</h2>
                <p>We use your information to provide, maintain, and improve our services, process transactions, and send you related information.</p>

                <h2>3. Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at{" "}
                    <a href={`mailto:${email}`}>{email}</a>.
                </p>
            </div>
        </div>
    );
}
