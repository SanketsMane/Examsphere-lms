import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Settings, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function AdminHelpPage() {
  await requireAdmin();

  const faqs = [
    {
      question: "How do I manage user roles and permissions?",
      answer: "Go to People → Users. Use the actions menu on a user to edit their details and role (Student, Teacher or Admin), suspend them, or delete the account. You cannot demote, suspend or delete yourself, and the last admin can never be removed."
    },
    {
      question: "How do I approve or reject teacher applications?",
      answer: "Open People → Teachers, or Support & Moderation → Verification Center → Profile Verification. Both list pending teachers and use the same approval flow: the teacher is notified in-app and by email. Rejecting requires a reason, which is shared with the teacher so they can re-submit."
    },
    {
      question: "How do I monitor platform analytics?",
      answer: "The Dashboard shows revenue, users, courses and payouts at a glance. System → Analytics has enrollment and revenue trends."
    },
    {
      question: "How do I manage courses?",
      answer: "Go to Catalog → Courses to create, edit, publish or delete courses. Teacher-submitted courses arrive with status Pending; set them to Published from the course's edit page."
    },
    {
      question: "How do I handle refunds and teacher payouts?",
      answer: "Use Commerce → Payments: All Transactions, Withdraw Requests and Refund Requests. All amounts are in Indian Rupees (₹)."
    },
    {
      question: "Where do I set contact details and social links?",
      answer: "Settings → Contact Details and Social Media. These are shown on the public Contact page and footer. Razorpay credentials are also configured there."
    },
    {
      question: "Where do contact form messages go?",
      answer: "Every Contact page submission is saved under People → Inquiries (source: contact form) and also emailed to the contact email in Settings."
    },
  ];

  const tasks = [
    { title: "Site Settings", description: "Contact details, social links, branding and payments", href: "/admin/settings", cta: "Settings" },
    { title: "Teacher Approvals", description: "Review pending teacher applications", href: "/admin/teachers", cta: "Review" },
    { title: "User Management", description: "Add, edit, suspend or remove users", href: "/admin/users", cta: "Manage" },
    { title: "Courses", description: "Create, edit and publish courses", href: "/admin/courses", cta: "Open" },
    { title: "Categories", description: "Exam categories shown on the site", href: "/admin/categories", cta: "Open" },
    { title: "Inquiries", description: "Contact form and chatbot leads", href: "/admin/inquiries", cta: "Open" },
    { title: "Email Templates", description: "Edit transactional email content", href: "/admin/email/templates", cta: "Open" },
    { title: "Analytics", description: "Usage and revenue reports", href: "/admin/analytics", cta: "View" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HelpCircle className="h-8 w-8" />
          Admin Help Center
        </h1>
        <p className="text-muted-foreground">Platform administration resources and support</p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-5 w-5" />
              Site Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Contact details, social links and payments</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/settings">Open Settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5" />
              Verification Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Teacher profiles and payout requests</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/verification">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5" />
              Email Diagnostics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Check email delivery and send a test</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/email">Open</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Admin FAQs</CardTitle>
          <CardDescription>Common administrative questions</CardDescription>
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

      {/* Common Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Common Administrative Tasks</CardTitle>
          <CardDescription>Quick access to frequent operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task) => (
            <div key={task.href} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">{task.title}</h4>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={task.href}>{task.cta}</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
