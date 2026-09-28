import { requireUser } from "@/app/data/user/require-user";
import { getContactDetails } from "@/app/data/settings/get-contact-details";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, LifeBuoy, Sparkles } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  await requireUser();
  const contact = await getContactDetails();

  const faqs = [
    {
      question: "How do I enroll in a course?",
      answer: "Open Browse Courses, choose a course and click 'Enroll Now'. For a paid course you'll be taken to the payment page."
    },
    {
      question: "How do I access my enrolled courses?",
      answer: "Go to My Courses in the sidebar to see every course you're enrolled in. Click a course to continue from its lessons."
    },
    {
      question: "How do I join a live session?",
      answer: "Your booked sessions are listed under Live Sessions. The Join button appears 15 minutes before the session starts."
    },
    {
      question: "Can I get a refund?",
      answer: "Live sessions can be cancelled from Live Sessions: 100% refund if cancelled 48+ hours before, 50% if 24-48 hours before, and no refund within 24 hours."
    },
    {
      question: "How do I track my progress?",
      answer: "Progress is saved as you mark lessons complete. Open Analytics in the sidebar to see your progress across courses."
    },
    {
      question: "How do I contact support?",
      answer: `Raise a ticket from Support Tickets in the sidebar and track its status there, or email us at ${contact.email}. We typically respond within 24 hours.`
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HelpCircle className="h-8 w-8" />
          Help & Support
        </h1>
        <p className="text-muted-foreground">Get help with using ExamSphere</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LifeBuoy className="h-5 w-5" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Report a problem with payments, courses or your account</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/issues/new">Raise a Ticket</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5" />
              ExamSphere AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Get instant help with study doubts, any time</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/ai">Ask ExamSphere AI</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Find answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Still Need Help?
          </CardTitle>
          <CardDescription>Contact our support team directly</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Email us at:{" "}
            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>
          </p>
          {contact.phone && (
            <p className="mb-4">
              Call us at:{" "}
              <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="text-primary hover:underline">{contact.phone}</a>
            </p>
          )}
          <p className="text-sm text-muted-foreground">We typically respond within 24 hours</p>
        </CardContent>
      </Card>
    </div>
  );
}
