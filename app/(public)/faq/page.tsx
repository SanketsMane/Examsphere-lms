
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>How do I find a teacher?</AccordionTrigger>
                    <AccordionContent>
                        You can browse our "Find Tutors" page to filter teachers by subject, price, and availability. Once you find a match, you can book a session directly.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>How do payments work?</AccordionTrigger>
                    <AccordionContent>
                        Payments are securely processed through our platform. You pay when you book a session. We hold the funds until the session is successfully completed.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>Can I teach on EXAMSPHERE?</AccordionTrigger>
                    <AccordionContent>
                        Yes! We interpret certified teachers and subject matter experts. Click "Become a Tutor" in the footer to start your application.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
