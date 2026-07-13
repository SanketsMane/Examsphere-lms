import { getSessionWithRole } from "../data/auth/require-roles";
import { getUserAnalytics } from "../actions/analytics";
import { ScheduleWidget } from "@/components/dashboard/dashboard-widgets";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getEnrolledCourses } from "../data/user/get-enrolled-courses";
import { CourseProgressCard } from "./_components/CourseProgressCard";
import { FreeClassWidget } from "./_components/FreeClassWidget";
import { ActivityFeed } from "./_components/ActivityFeed";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { getStudentSchedule } from "../data/student/get-student-schedule";
import { PageHeader, StatCard, Panel, ProgressBar } from "@/components/dashboard/es/dashboard-kit";
import { BookOpen, Target, Sparkles, Award, Activity, LineChart, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");
  if (session.user.role === "admin") redirect("/admin");

  const userId = session?.user?.id || "";
  const analytics = await getUserAnalytics(userId);
  const enrolledCourses = await getEnrolledCourses();
  const scheduleItems = await getStudentSchedule(userId);
  const freeUsage = await prisma.freeClassUsage.findUnique({ where: { studentId: userId } });

  const firstName = session.user.name?.split(" ")[0] || "there";

  const profileFields = [
    { label: "Avatar", value: !!session.user.image },
    { label: "Name", value: !!session.user.name },
    { label: "Role Set", value: !!session.user.role },
    { label: "Email Verified", value: true },
  ];
  const completedFields = profileFields.filter((f) => f.value).length;
  const completionPercentage = Math.round((completedFields / profileFields.length) * 100);

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Welcome back, {firstName} <span className="animate-bounce">👋</span>
          </span>
        }
        subtitle={
          <>
            You&apos;ve completed{" "}
            <span className="font-bold text-navy-900 dark:text-blue-300">
              {analytics.stats.totalLessonsCompleted} lessons
            </span>{" "}
            so far. Keep it up!
          </>
        }
      >
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-orange-600"
        >
          Browse Courses <ArrowRight className="size-4" />
        </Link>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} accent="navy" label="Lessons Done" value={analytics.stats.totalLessonsCompleted.toString()} hint="Keep learning!" />
        <StatCard icon={Target} accent="orange" label="Courses Completed" value={analytics.stats.completedCourses.toString()} hint={`of ${analytics.stats.enrollmentCount} enrolled`} />
        <StatCard icon={Sparkles} accent="green" label="Sessions Attended" value={analytics.stats.completedSessions.toString()} hint={`${analytics.stats.totalSessionsBooked} booked`} />
        <StatCard icon={Award} accent="violet" label="Certificates" value={analytics.stats.certificatesCount.toString()} hint="Earned" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left (span 2) */}
        <div className="xl:col-span-2 space-y-6">
          <Panel title="Current Learning" icon={BookOpen} action={{ label: "My Courses", href: "/dashboard/courses" }}>
            {enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledCourses.slice(0, 4).map((enrollment: any) => (
                  <CourseProgressCard key={enrollment.Course.id} data={enrollment} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-navy-900/10 text-navy-900 dark:bg-blue-500/15 dark:text-blue-300">
                  <BookOpen className="size-6" />
                </div>
                <h4 className="font-display font-bold text-navy-950 dark:text-white">Start your journey</h4>
                <p className="mb-4 mt-1 max-w-md text-sm text-ink-500 dark:text-muted-foreground">
                  You haven&apos;t enrolled in any courses yet. Browse our library to find the perfect course.
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-950"
                >
                  Browse Library
                </Link>
              </div>
            )}
          </Panel>

          <Panel title="Recent Activity" icon={Activity}>
            <ActivityFeed activities={analytics.recentActivity} />
          </Panel>

          <Panel title="Learning Consistency" icon={LineChart} bodyClassName="p-2 sm:p-4">
            <ChartAreaInteractive data={analytics.activityData} dataKey="lessons" label="Lessons Completed" color="#FF7A1A" />
          </Panel>
        </div>

        {/* Right (span 1) */}
        <div className="space-y-6">
          <Panel title="Profile Status">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink-700 dark:text-muted-foreground">Completion</span>
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-[10px]">
                {completionPercentage}%
              </Badge>
            </div>
            <ProgressBar value={completionPercentage} accent="green" />
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {profileFields.map((field) => (
                <div key={field.label} className="flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${field.value ? "bg-es-green-600" : "bg-ink-500/40"}`} />
                  <span className="text-[11px] font-medium text-ink-700 dark:text-muted-foreground">{field.label}</span>
                </div>
              ))}
            </div>
            {completionPercentage < 100 && (
              <Link
                href="/dashboard/settings"
                className="mt-4 block rounded-full border border-dashed border-navy-900/30 py-2 text-center text-xs font-semibold text-navy-900 hover:bg-navy-900/5 dark:text-blue-300"
              >
                Complete Profile
              </Link>
            )}
          </Panel>

          <FreeClassWidget usage={freeUsage} />

          <ScheduleWidget items={scheduleItems} />
        </div>
      </div>
    </div>
  );
}
