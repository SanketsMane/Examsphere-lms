import { prisma } from "@/lib/db";
import { requireTeacher } from "@/app/data/auth/require-roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSessionForm } from "../_components/CreateSessionForm";
import { ArrowLeft, Video, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CreateSessionPage() {
  await requireTeacher();

  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Header with Breadcrumbs - Refined by Sanket */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Link href="/teacher/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/teacher/sessions" className="hover:text-primary transition-colors">Live Sessions</Link>
            <span>/</span>
            <span className="text-foreground">Create</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                Create Live Session
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Design a high-impact learning experience. Set your schedule, define your curriculum, and start teaching globally.
            </p>
          </div>
          
          <Link href="/teacher/sessions">
            <Button variant="outline" className="hidden sm:flex items-center gap-2 border-2 font-bold shadow-sm transition-all active:scale-95">
              <ArrowLeft className="h-4 w-4" />
              Back to Sessions
            </Button>
          </Link>
        </div>
      </div>

      {/* Form Implementation */}
      <div className="bg-background/50 backdrop-blur-sm rounded-3xl">
        <CreateSessionForm subjects={subjects} />
      </div>
    </div>
  );
}
