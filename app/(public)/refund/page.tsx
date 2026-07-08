import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ReceiptText } from "lucide-react";

export const metadata = {
  title: "Refund Policy — ExamSphere",
  description: "ExamSphere refund and cancellation policy for course enrolments.",
};

export default function RefundPage() {
  return (
    <div className="container mx-auto px-4 py-24 md:py-32 flex flex-col items-center justify-center text-center space-y-8">
      <div className="space-y-4">
        <ReceiptText className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold font-display text-navy-950 dark:text-white">
          Refund Policy
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          We want you to be confident in your decision to learn with ExamSphere. This policy
          explains when and how refunds are handled for course enrolments.
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-2xl text-left bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-bold mb-3">Eligibility</h3>
        <p className="text-slate-500 mb-6">
          Refund requests must be raised within <strong>7 days</strong> of purchase, provided you
          have not consumed a significant portion of the course content (as determined by course
          progress and downloads).
        </p>

        <h3 className="text-xl font-bold mb-3">How to request a refund</h3>
        <ul className="list-disc pl-5 space-y-2 text-slate-500 mb-6">
          <li>Email us using the query form in the footer or write to our support address.</li>
          <li>Include your registered email, the course name, and your order reference.</li>
          <li>Our team will review and respond within 5–7 business days.</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Non-refundable items</h3>
        <ul className="list-disc pl-5 space-y-2 text-slate-500 mb-6">
          <li>Live one-to-one sessions that have already been attended.</li>
          <li>Test series or materials that have been substantially accessed.</li>
          <li>Purchases made under clearly-marked non-refundable promotions.</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Processing</h3>
        <p className="text-slate-500">
          Approved refunds are credited to the original payment method within 7–10 business days.
          Bank or gateway processing times may vary.
        </p>

        <p className="text-xs text-slate-400 mt-6">
          Note: This is a general template. Please confirm the final terms with ExamSphere before
          publishing.
        </p>
      </div>

      <Button variant="outline" asChild>
        <Link href="/" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
}
