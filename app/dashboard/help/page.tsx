import { requireUser } from "@/app/data/user/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, MessageSquare, Book, Video } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  await requireUser();

  const faqs = [
    {
      question: "How do I enroll in a course?",
      answer: "Browse available courses, click on a course you're interested in, and click the 'Enroll Now' button. If the course is paid, you'll be directed to the payment page."
    },
    {
      question: "How do I access my enrolled courses?",
      answer: "Go to Dashboard > My Courses to see all your enrolled courses. Click on any course to access the lessons."
    },
    {
      question: "How do I book a live session?",
      answer: "Navigate to Live Sessions, browse available sessions, and click 'Book Session' on your preferred time slot. Complete the payment to confirm your booking."
    },
    {
      question: "Can I get a refund?",
      answer: "Yes, you can cancel live sessions and get refunds based on our cancellation policy: 100% refund if cancelled 48+ hours before, 50% if 24-48 hours before, no refund if less than 24 hours."
    },
    {
      question: "How do I track my progress?",
      answer: "Your progress is automatically tracked as you complete lessons. Visit Dashboard > Analytics to see detailed progress reports and statistics."
    },
    {
      question: "How do I contact support?",
      answer: "You can reach our support team through the contact form below, or email us at support@examsphere.com. We typically respond within 24 hours."
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HelpCircle className="h-8 w-8" />
          Help & Support
        </h1>
        <p className="text-muted-foreground">Get help with using the platform</p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Book className="h-5 w-5" />
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Browse our comprehensive guides</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/docs">View Docs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="h-5 w-5" />
              Video Tutorials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Watch step-by-step tutorials</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tutorials">Watch Now</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5" />
              Live Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Chat with our support team</p>
            <Button variant="outline" size="sm">Start Chat</Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
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

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Still Need Help?
          </CardTitle>
          <CardDescription>Contact our support team directly</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Email us at: <a href="mailto:support@examsphere.com" className="text-primary hover:underline">support@examsphere.com</a></p>
          <p className="text-sm text-muted-foreground">We typically respond within 24 hours</p>
        </CardContent>
      </Card>
    </div>
  );
}
