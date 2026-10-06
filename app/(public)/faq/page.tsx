import type { Metadata } from "next";
import { withSocial } from "@/lib/seo-metadata";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PROGRAMS } from "@/app/(public)/_data/programs-content";
import { JsonLd, faqPage } from "@/components/seo/JsonLd";

export const metadata: Metadata = withSocial({
    alternates: { canonical: "/faq" },
    title: "FAQ | ExamSphere",
    description: "Answers to common questions about ExamSphere's JEE, NEET, Foundation, Class 11–12 and MBBS programmes, fees, enrolment and refunds.",
});

// `text` is the plain version of each answer for structured data; keep the two in sync.
const GENERAL_FAQS: { q: string; a: React.ReactNode; text: string }[] = [
    {
        q: "How do I enroll in a course?",
        a: (
            <>
                Open the <Link href="/programs" className="text-primary hover:underline">Programs</Link> page and
                tap Enroll Now on your programme, or go straight to{" "}
                <Link href="/courses" className="text-primary hover:underline">Courses</Link>. Log in or create an
                account, choose your course and tap Enroll — our admissions team will contact you with the fee and
                batch details.
            </>
        ),
        text: "Open the Programs page and tap Enroll Now on your programme, or go straight to Courses. Log in or create an account, choose your course and tap Enroll — our admissions team will contact you with the fee and batch details.",
    },
    {
        q: "What are the fees?",
        a: (
            <>
                Fees depend on the programme and batch and aren&apos;t listed on the website. Ask our admissions
                team through the chat, the query form in the footer or the{" "}
                <Link href="/contact" className="text-primary hover:underline">Contact</Link> page and we&apos;ll
                share the details for your batch.
            </>
        ),
        text: "Fees depend on the programme and batch and aren't listed on the website. Ask our admissions team through the chat, the query form or the Contact page and we'll share the details for your batch.",
    },
    {
        q: "Can I get a refund?",
        a: (
            <>
                Refunds are handled as described in our{" "}
                <Link href="/refund" className="text-primary hover:underline">Refund Policy</Link>.
            </>
        ),
        text: "Refunds are handled as described in our Refund Policy.",
    },
    {
        q: "I have a question that isn't answered here.",
        a: (
            <>
                Use the chat on this page, the query form in the footer, or our{" "}
                <Link href="/contact" className="text-primary hover:underline">Contact</Link> page and our team will
                get back to you.
            </>
        ),
        text: "Use the chat on this page, the query form in the footer, or our Contact page and our team will get back to you.",
    },
];

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
    // Native <details> keeps every answer in the served HTML (a Radix accordion drops closed
    // panels from the markup, hiding the answers from search engines).
    return (
        <details className="group border-b py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
                {q}
                <Plus className="h-4 w-4 shrink-0 transition-transform group-open:rotate-45" aria-hidden />
            </summary>
            <div className="mt-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
        </details>
    );
}

export default function FAQPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-3xl">
            {/* Programme FAQs are marked up on their own programme pages; mark each question once. */}
            <JsonLd data={faqPage(GENERAL_FAQS.map((f) => ({ q: f.q, a: f.text })))} />
            <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-2">Enrolment &amp; fees</h2>
                {GENERAL_FAQS.map((faq) => (
                    <FaqItem key={faq.q} q={faq.q}>{faq.a}</FaqItem>
                ))}
            </section>

            {/* Programme answers come from the programme pages so the two never disagree. */}
            {PROGRAMS.map((program) => (
                <section key={program.slug} className="mb-10">
                    <h2 className="text-xl font-semibold mb-2">
                        <Link href={`/programs/${program.slug}`} className="hover:text-primary">
                            {program.title}
                        </Link>
                    </h2>
                    {program.faqs.map((faq) => (
                        <FaqItem key={faq.q} q={faq.q}>{faq.a}</FaqItem>
                    ))}
                </section>
            ))}
        </div>
    );
}
