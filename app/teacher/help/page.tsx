import { requireUser } from "@/app/data/user/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, MessageSquare, Book, Video, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeacherHelpPage() {
  await requireUser();

  const faqs = [
    {
      question: "How do I create a new course?",
      answer: "Go to 'Create Course' from the sidebar, fill in course details including title, description, and pricing. Then add lessons with content, videos, and materials."
    },
    {
      question: "How do I schedule a live session?",
      answer: "Navigate to Live Sessions > Create Session. Set the title, description, date/time, duration, maximum participants, and price. Students will be able to book once published."
    },
    {
      question: "How do I get paid?",
      answer: "Payments are processed through our secure payment gateway. Set up your bank account details in Settings > Payment Settings. Earnings are automatically transferred to your account every week."
    },
    {
      question: "How do I track student progress?",
      answer: "Visit Analytics to see detailed reports on student enrollments, course completion rates, and engagement metrics. You can also view individual student progress from the Students page."
    },
    {
      question: "Can I edit published courses?",
      answer: "Yes, you can edit course content anytime. Go to My Courses, select the course, and click Edit. Changes are reflected immediately for all enrolled students."
    },
    {
      question: "How do I communicate with students?",
      answer: "Use the Messages feature to communicate with your students. You can send individual messages or announcements to all students in a course."
    },
    {
      question: "What's the cancellation policy for live sessions?",
      answer: "If you need to cancel a session, do so at least 48 hours in advance. Students will receive full refunds. Last-minute cancellations may affect your rating."
    },
    {
      question: "How do I upload course materials?",
      answer: "When creating or editing a lesson, use the file upload feature to add PDFs, documents, presentations, and other resources for your students."
    }
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

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Book className="h-5 w-5" />
              Teaching Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Complete guide for creating great courses</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/teacher/guide">Read Guide</Link>
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
            <p className="text-sm text-muted-foreground mb-3">Watch tutorials on course creation</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/teacher/tutorials">Watch Now</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Tips for engaging students</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/teacher/best-practices">View Tips</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
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

      {/* Support Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>More ways to improve your teaching</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Teacher Community</h4>
              <p className="text-sm text-muted-foreground">Connect with other teachers</p>
            </div>
            <Button variant="outline" size="sm">Join</Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Live Webinars</h4>
              <p className="text-sm text-muted-foreground">Monthly training sessions</p>
            </div>
            <Button variant="outline" size="sm">Register</Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Resource Library</h4>
              <p className="text-sm text-muted-foreground">Templates and materials</p>
            </div>
            <Button variant="outline" size="sm">Browse</Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Need More Help?
          </CardTitle>
          <CardDescription>Contact our teacher support team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Email: <a href="mailto:teachers@examsphere.com" className="text-primary hover:underline">teachers@examsphere.com</a></p>
          <p>Phone: +91 1800-123-4567 (Mon-Fri, 9 AM - 6 PM IST)</p>
          <p className="text-sm text-muted-foreground">Priority support for teachers - typically respond within 12 hours</p>
          <Button className="mt-2">
            <MessageSquare className="h-4 w-4 mr-2" />
            Start Live Chat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
