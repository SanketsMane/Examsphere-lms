import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cookie } from "lucide-react";
import type { Metadata } from "next";
import { withSocial } from "@/lib/seo-metadata";

export const metadata: Metadata = withSocial({
  alternates: { canonical: "/cookies" },
  title: "Cookie Policy | ExamSphere",
  description: "How ExamSphere uses cookies for sign-in, security and your preferences.",
});

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center text-center space-y-8">
      <div className="space-y-4">
        <Cookie className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Cookie Policy
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          We use cookies to improve your experience and analyze our traffic. By using our site, you consent to our use of cookies.
        </p>
      </div>
      
      <div className="prose dark:prose-invert max-w-2xl text-left bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-bold mb-4">What are cookies?</h3>
        <p className="text-slate-500 mb-6">
          Cookies are small text files that are placed on your computer by websites that you visit. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
        </p>
        
        <h3 className="text-xl font-bold mb-4">How we use them</h3>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li><strong>Authentication:</strong> We use cookies to verify your account and determine when you're logged in.</li>
          <li><strong>Security:</strong> We use cookies to help us keep your account and information safe.</li>
          <li><strong>Preferences:</strong> We use cookies to remember your settings and preferences.</li>
        </ul>
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
