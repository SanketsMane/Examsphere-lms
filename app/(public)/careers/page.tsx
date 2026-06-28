import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase } from "lucide-react";

export default function CareersPage() {
  return (
    <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center text-center space-y-8">
      <div className="space-y-4">
        <Briefcase className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Careers at EXAMSPHERE
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Join our mission to reshape the future of online education. We're always looking for passionate individuals to join our team.
        </p>
      </div>
      
      <div className="p-8 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">No open positions currently</h2>
        <p className="text-slate-500 mb-6">
          We are not currently hiring for any specific roles, but we'd still love to hear from you! Send your CV to careers@examsphere.com.
        </p>
        <Button variant="default" asChild>
          <a href="mailto:careers@examsphere.com">
            Send Resume
          </a>
        </Button>
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
