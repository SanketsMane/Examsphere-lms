import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          About EXAMSPHERE
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-autoLeading-relaxed">
          EXAMSPHERE is the world's leading online learning platform. Join millions of learners and instructors gathering to master new skills.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl pt-8">
        {[
          { title: "Our Mission", desc: "To empower learners worldwide through accessible, high-quality education." },
          { title: "Expert Mentors", desc: "Learn from industry professionals and passionate educators." },
          { title: "Community Driven", desc: "A vibrant ecosystem where curiosity meets opportunity." }
        ].map((item) => (
          <div key={item.title} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-left">
            <h3 className="font-bold text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-slate-500">{item.desc}</p>
          </div>
        ))}
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
