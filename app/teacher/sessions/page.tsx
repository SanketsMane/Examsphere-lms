import { prisma } from "@/lib/db";
import { requireTeacher } from "@/app/data/auth/require-roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Plus,
  Settings,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Layers
} from "lucide-react";
import Link from "next/link";
import { SessionsList } from "./_components/SessionsList";
import { SessionStats } from "./_components/SessionStats";
import { SessionTemplatesManager } from "@/components/teacher/SessionTemplatesManager";

export const dynamic = "force-dynamic";

export default async function TeacherSessionsPage() {
  await requireTeacher();
  
  const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your 1-on-1 tutoring sessions and availability
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/teacher/sessions/availability">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Set Availability
            </Button>
          </Link>
          <Link href="/teacher/sessions/bulk">
            <Button variant="outline" className="border-indigo-600/50 text-indigo-600 hover:bg-indigo-50">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Schedule
            </Button>
          </Link>
          <Link href="/teacher/sessions/create">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <SessionStats />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Quick Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Create sessions that students can book instantly
            </p>
            <Link href="/teacher/sessions/create">
              <Button variant="outline" size="sm" className="w-full">
                Create Open Slot
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Set your recurring weekly schedule
            </p>
            <Link href="/teacher/sessions/availability">
              <Button variant="outline" size="sm" className="w-full">
                Manage Schedule
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              View your session performance metrics
            </p>
            <Link href="/teacher/analytics?tab=sessions">
              <Button variant="outline" size="sm" className="w-full">
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>My Sessions</CardTitle>
          <CardDescription>
            Manage and track all your live tutoring sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="available" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Available
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Cancelled
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <SessionsList status="scheduled" filter="booked" />
            </TabsContent>

            <TabsContent value="available">
              <SessionsList status="scheduled" filter="available" />
            </TabsContent>

            <TabsContent value="completed">
              <SessionsList status="completed" />
            </TabsContent>

            <TabsContent value="cancelled">
              <SessionsList status="cancelled" />
            </TabsContent>

            <TabsContent value="templates">
              <SessionTemplatesManager subjects={subjects as any} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Getting Started with Live Sessions</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Create sessions with specific times or set your recurring availability so students
                can book sessions that fit their schedule. You'll receive notifications for new bookings.
              </p>
              <Link href="/teacher/sessions/create?tutorial=true">
                <Button variant="outline" size="sm">
                  Take Tutorial
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
