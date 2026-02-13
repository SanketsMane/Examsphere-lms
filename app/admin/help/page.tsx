import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Mail, Book, FileText, Server, Shield } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function AdminHelpPage() {
  await requireAdmin();

  const faqs = [
    {
      question: "How do I manage user roles and permissions?",
      answer: "Go to Team > Members to view all users. Click on a user to edit their role (Admin, Teacher, or Student). Admins have full access, Teachers can create courses, and Students can only enroll."
    },
    {
      question: "How do I approve or reject teacher applications?",
      answer: "Navigate to Team > Pending Requests to see teacher applications. Review their credentials and click Approve or Reject. Approved teachers can immediately start creating courses."
    },
    {
      question: "How do I monitor platform analytics?",
      answer: "Visit Analytics to see comprehensive platform metrics including user registrations, course enrollments, revenue, active users, and engagement statistics."
    },
    {
      question: "How do I manage course approvals?",
      answer: "Go to Courses > Pending Review to see courses awaiting approval. Review content for quality and compliance, then Approve or Request Changes."
    },
    {
      question: "How do I handle payment disputes?",
      answer: "Navigate to Analytics > Transactions to view all payments. Filter for disputed transactions, review details, and process refunds if necessary through the payment gateway."
    },
    {
      question: "How do I configure platform settings?",
      answer: "Visit Settings to configure email, payment gateway, security policies, maintenance mode, and other platform-wide settings."
    },
    {
      question: "How do I backup the database?",
      answer: "Go to Settings > Database & Backups. Enable automatic daily backups or create manual backups. You can also restore from previous backups if needed."
    },
    {
      question: "How do I handle reported content?",
      answer: "Check the Reports section to see user-reported courses, comments, or content. Review each report and take appropriate action (remove content, warn user, or dismiss report)."
    }
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
              <Book className="h-5 w-5" />
              Admin Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Complete platform administration guide</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/documentation">Read Docs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Monitor system health and uptime</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/status">View Status</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" />
              Security Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Best practices for platform security</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/security">Learn More</Link>
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
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">User Management</h4>
              <p className="text-sm text-muted-foreground">Add, edit, or remove users</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/team">Manage</Link>
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Course Moderation</h4>
              <p className="text-sm text-muted-foreground">Review and approve courses</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/courses">Review</Link>
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Platform Analytics</h4>
              <p className="text-sm text-muted-foreground">View usage and revenue reports</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/analytics">View Analytics</Link>
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">System Settings</h4>
              <p className="text-sm text-muted-foreground">Configure platform settings</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/settings">Settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Technical Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Technical Resources
          </CardTitle>
          <CardDescription>Advanced administration resources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium mb-1">API Documentation</h4>
            <p className="text-sm text-muted-foreground mb-2">Access the platform API for integrations</p>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/api/docs">View API Docs →</Link>
            </Button>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium mb-1">Database Schema</h4>
            <p className="text-sm text-muted-foreground mb-2">Platform database structure and relationships</p>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/admin/schema">View Schema →</Link>
            </Button>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium mb-1">Webhook Configuration</h4>
            <p className="text-sm text-muted-foreground mb-2">Set up webhooks for external integrations</p>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/admin/webhooks">Configure →</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Support & Emergency Contacts
          </CardTitle>
          <CardDescription>For urgent administrative issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium">Technical Support</p>
            <p className="text-sm">Email: <a href="mailto:admin-support@kidokool.com" className="text-primary hover:underline">admin-support@kidokool.com</a></p>
            <p className="text-sm">Phone: +91 1800-ADMIN-00 (24/7)</p>
          </div>
          <Separator />
          <div>
            <p className="font-medium">Emergency Escalation</p>
            <p className="text-sm">For critical system issues only</p>
            <p className="text-sm">Email: <a href="mailto:emergency@kidokool.com" className="text-primary hover:underline">emergency@kidokool.com</a></p>
          </div>
          <Separator />
          <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Platform Status Page</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">Check for ongoing incidents: status.kidokool.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
