import { requireTeacher } from "@/app/data/auth/require-roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSessionForm } from "../_components/CreateSessionForm";
import { ArrowLeft, Video, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CreateSessionPage() {
  await requireTeacher();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/sessions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Create Live Session</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new 1-on-1 tutoring session for students to book
          </p>
        </div>
      </div>

      {/* Form */}
      <CreateSessionForm />
    </div>
  );
}
    </div>
  );
}
