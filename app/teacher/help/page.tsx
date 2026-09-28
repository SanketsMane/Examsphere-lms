import { requireUser } from "@/app/data/user/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, BookOpen, IndianRupee, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeacherHelpPage() {
  await requireUser();

  const faqs = [
    {
      question: "When can I start teaching?",
      answer: "After you upload your ID (Aadhaar, PAN or Passport) and qualification documents on Profile Verification and submit them, an admin reviews your application. Course and session tools unlock once you are approved."
    },
    {
      question: "How do I create a new course?",
      answer: "Go to 'Create Course' from the sidebar and fill in the details (title, description, category, price in ₹). Add chapters and at least one lesson, then click 'Submit for Review'. Every course is reviewed by an admin before it is published."
    },
    {
      question: "How do I schedule a live session?",
      answer: "Navigate to Live Sessions > Create Session. Set the title, subject, date/time, duration and price in ₹. For 1-on-1 bookings, set your 30 and 60 minute rates on Pricing & Offerings — students can't book you until a rate is set."
    },
    {
      question: "How do I get paid?",
      answer: "Add your Indian bank account (account number and IFSC code) on the Profile Verification page. Your earnings appear under Payouts & Earnings, where you can request a payout once your available balance is at least ₹50. Each request is reviewed before it is transferred."
    },
    {
      question: "How do I track student progress?",
      answer: "Visit Analytics for enrollment and engagement reports. You can also open an individual student from the Students page to see their progress in your courses."
    },
    {
      question: "Can I edit published courses?",
      answer: "Yes. Editing course details keeps the course's current status. Chapters and lessons can be updated at any time. If a course was archived, resubmit it for review from the course editor."
    },
    {
      question: "How do I communicate with students?",
      answer: "Use Messages for one-to-one conversations. From the Students page you can send an announcement, which appears as a notification for students enrolled in your courses."
    },
    {
      question: "How do I upload course materials?",
      answer: "When creating or editing a lesson, use the file upload to add PDFs and videos. Standalone files can be shared from the Resources page."
    }
  ];

  const quickLinks = [
    { icon: ShieldCheck, title: "Profile Verification", description: "Upload documents and bank details", href: "/teacher/verification", cta: "Open" },
    { icon: BookOpen, title: "Create a Course", description: "Build and submit a course for review", href: "/teacher/courses/create", cta: "Start" },
    { icon: IndianRupee, title: "Pricing & Offerings", description: "Set your 1-on-1 session rates", href: "/teacher/pricing", cta: "Set rates" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HelpCircle className="h-8 w-8" />
          Teacher Help Center
        </h1>
        <p className="text-muted-foreground">Resources and support for teachers</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Card key={link.href}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <link.icon className="h-5 w-5" />
                {link.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{link.description}</p>
              <Button variant="outline" size="sm" asChild>
                <Link href={link.href}>{link.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Common questions from teachers</CardDescription>
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
            Need More Help?
          </CardTitle>
          <CardDescription>Contact the ExamSphere support team</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
