"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  ArrowLeft,
  AlertCircle,
  RefreshCcw,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { RescheduleForm } from "../../_components/RescheduleForm";

interface Session {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  status: string;
  student?: {
    name: string;
    email: string;
  };
}

export default function ReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/teacher/sessions/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Session not found");
            router.push("/teacher/sessions");
            return;
          }
          throw new Error("Failed to fetch session details");
        }
        const data = await response.json();
        setSession(data.session);
      } catch (error) {
        console.error("Error fetching session:", error);
        toast.error("Could not load session details");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id, router]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) return null;

  return (
    <MotionWrapper className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/teacher/sessions" className="hover:text-primary transition-colors">
          Live Sessions
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/teacher/sessions/${session.id}`} className="hover:text-primary transition-colors">
          Details
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Reschedule</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href={`/teacher/sessions/${session.id}`} className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Details
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Reschedule Session</h1>
          <p className="text-muted-foreground">Change the date or time for "{session.title}"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Schedule Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Current Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Date</p>
                  <p className="font-medium">{format(new Date(session.scheduledAt), "MMM dd, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Time</p>
                  <p className="font-medium">{format(new Date(session.scheduledAt), "hh:mm a")}</p>
                </div>
              </div>
              {session.student && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Booked By</p>
                  <p className="font-medium">{session.student.name}</p>
                  <p className="text-xs text-muted-foreground">{session.student.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reschedule Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCcw className="w-5 h-5 text-blue-600" />
                New Schedule Details
              </CardTitle>
              <CardDescription>
                Select a new date and time for the session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RescheduleForm sessionId={session.id} currentScheduledAt={session.scheduledAt} />
            </CardContent>
          </Card>
        </div>
      </div>
    </MotionWrapper>
  );
}
