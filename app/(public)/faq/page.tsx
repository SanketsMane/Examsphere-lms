import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PROGRAMS } from "@/app/(public)/_data/programs-content";

export const metadata: Metadata = {
    title: "FAQ | ExamSphere",
    description: "Answers to common questions about ExamSphere's JEE, NEET, Foundation, Class 11–12 and MBBS programmes, fees, enrolment and refunds.",
};

const GENERAL_FAQS: { q: string; a: React.ReactNode }[] = [
    {
        q: "How do I enroll in a course?",
        a: (
            <>
                Open the <Link href="/programs" className="text-primary hover:underline">Programs</Link> page and
                tap Enroll Now on your programme, or go straight to{" "}
                <Link href="/courses" className="text-primary hover:underline">Courses</Link>. Log in or create an
                account, choose your course and complete the payment online.
            </>
        ),
    },
    {
        q: "Where can I see the fees?",
        a: (
            <>
                Each course shows its fee on the{" "}
                <Link href="/courses" className="text-primary hover:underline">Courses</Link> page and on the
                course&apos;s own page before you pay.
            </>
        ),
    },
    {
        q: "Can I get a refund?",
        a: (
            <>
                Refunds are handled as described in our{" "}
                <Link href="/refund" className="text-primary hover:underline">Refund Policy</Link>.
            </>
        ),
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
    },
];

export default function FAQPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-2">Enrolment &amp; fees</h2>
                <Accordion type="single" collapsible className="w-full">
                    {GENERAL_FAQS.map((faq, i) => (
                        <AccordionItem key={faq.q} value={`general-${i}`}>
                            <AccordionTrigger>{faq.q}</AccordionTrigger>
                            <AccordionContent>{faq.a}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>

            {/* Programme answers come from the programme pages so the two never disagree. */}
            {PROGRAMS.map((program) => (
                <section key={program.slug} className="mb-10">
                    <h2 className="text-xl font-semibold mb-2">
                        <Link href={`/programs/${program.slug}`} className="hover:text-primary">
                            {program.title}
                        </Link>
                    </h2>
                    <Accordion type="single" collapsible className="w-full">
                        {program.faqs.map((faq, i) => (
                            <AccordionItem key={faq.q} value={`${program.slug}-${i}`}>
                                <AccordionTrigger>{faq.q}</AccordionTrigger>
                                <AccordionContent>{faq.a}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </section>
            ))}
        </div>
    );
}
