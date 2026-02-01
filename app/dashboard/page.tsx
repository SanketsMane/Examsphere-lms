import { getSessionWithRole } from "../data/auth/require-roles";
import { getUserAnalytics } from "../actions/analytics";
import { StatsCard, ScheduleWidget, ActivityFeed, QuickActions } from "@/components/dashboard/dashboard-widgets";
import { IconBook, IconTrophy, IconClock, IconFlame, IconSearch, IconSparkles } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getEnrolledCourses } from "../data/user/get-enrolled-courses";
import { CourseProgressCard } from "./_components/CourseProgressCard";
import { FreeClassWidget } from "./_components/FreeClassWidget";
import { Input } from "@/components/ui/input";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { ArrowRight, PlayCircle, BookOpen, Clock, Target } from "lucide-react";
import { RevenueCard } from "@/components/dashboard/yo-coach/revenue-card"; // Reusing for consistency
import { StatBox } from "@/components/dashboard/yo-coach/stat-box";
import { ChartSection } from "@/components/dashboard/yo-coach/chart-section";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { getStudentSchedule } from "../data/student/get-student-schedule";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionWithRole();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "admin") redirect("/admin");

  // if (session.user.role === "teacher") redirect("/teacher"); // Allow teachers to view student dashboard

  const userId = session?.user?.id || '';
  const analytics = await getUserAnalytics(userId);
  const enrolledCourses = await getEnrolledCourses();
  const scheduleItems = await getStudentSchedule(userId);
  const freeUsage = await prisma.freeClassUsage.findUnique({ where: { studentId: userId } });

  // Recent activity adapted from analytics
  // const recentActivity = analytics.recentActivity ... (TODO: Map this if needed for a widget)

  // Yo-Coach Style Top Cards (Adapted for Student)
  const topStats = [
    {
      title: "Lessons Done",
      amount: analytics.stats.totalLessonsCompleted.toString(),
      subTitle: "Keep learning!",
      icon: <BookOpen className="h-5 w-5" />,
      variant: "blue" as const
    },
    {
      title: "Completed Courses",
      amount: analytics.stats.completedCourses.toString(),
      subTitle: `Out of ${analytics.stats.enrollmentCount} enrolled`,
      icon: <IconTrophy className="h-5 w-5" />,
      variant: "orange" as const
    },
    {
      title: "Sessions Attended",
      amount: analytics.stats.completedSessions.toString(),
      subTitle: `${analytics.stats.totalSessionsBooked} booked total`,
      icon: <IconFlame className="h-5 w-5" />,
      variant: "purple" as const
    }
  ];

  // Fetch current user with preferences for completion logic
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true }
  });

  const profileFields = [
    { label: "Avatar", value: !!userData?.image },
    { label: "Bio", value: !!userData?.bio },
    { label: "Education", value: !!userData?.education },
    { label: "Interests", value: (userData?.preferences?.categories?.length ?? 0) > 0 },
  ];

  const completedFields = profileFields.filter(f => f.value).length;
  const completionPercentage = Math.round((completedFields / profileFields.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
          <p className="text-muted-foreground text-sm">Track your learning progress and upcoming classes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/calendar" className="hidden md:flex">
            <Button variant="outline">View Calendar</Button>
          </Link>
          <Link href="/courses">
            <Button className="bg-[#1e293b] hover:bg-[#0f172a]">Browse Courses</Button>
          </Link>
        </div>
      </div>

      {/* 1. Top Stats Row (Yo-Coach Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topStats.map((stat, i) => (
          <RevenueCard key={i} {...stat} />
        ))}
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Courses Box */}
          <div className="bg-white dark:bg-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Active Courses</h3>
              <Link href="/dashboard/courses" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
            </div>

            {enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledCourses.slice(0, 4).map((course: any) => (
                  <CourseProgressCard key={course.Course.id} data={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                <p className="text-muted-foreground text-sm mb-4">You have no active courses.</p>
                <Link href="/courses"><Button variant="outline">Browse Marketplace</Button></Link>
              </div>
            )}
          </div>

          {/* Learning Activity Chart */}
          <ChartSection
            title="Learning Activity"
            tabs={["Lessons"]}
            activeTab="Lessons"
            className="bg-white dark:bg-card border border-gray-200 dark:border-gray-800"
          >
            <ChartAreaInteractive
              data={analytics.activityData}
              dataKey="lessons"
              label="Lessons Completed"
              color="#3b82f6"
            />
          </ChartSection>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          {/* Profile Completion Widget */}
          <div className="bg-white dark:bg-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Profile Status</h3>
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-[10px] px-2 py-0">
                {completionPercentage}% Complete
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {profileFields.map((field, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${field.value ? "bg-green-500" : "bg-slate-300"}`} />
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{field.label}</span>
                  </div>
                ))}
              </div>

              {completionPercentage < 100 && (
                <Link href="/dashboard/settings" className="block mt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs h-8 border-dashed border-blue-200 hover:border-blue-400 text-blue-600 hover:bg-blue-50">
                    Complete Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>

            {/* Replaced WalletWidget with Enrollment Stats since no wallet exists */}
            {/* Free Class Usage Widget */}
             <FreeClassWidget usage={freeUsage} />

             {/* Stat Box replaced Wallet */}
            <StatBox
            title="Overview"
            mainStat={{ label: "Active Courses", value: enrolledCourses.length.toString(), subValue: "In Progress" }}
            secondaryStat={{ label: "Total Completed", value: analytics.stats.completedCourses.toString(), subValue: "Lifetime" }}
            accentColor="bg-green-500"
          />

          <ScheduleWidget items={scheduleItems} />

          {/* Quick Stats Box */}
          <StatBox
            title="Achievements"
            mainStat={{ label: "Certificates", value: analytics.stats.certificatesCount.toString(), subValue: "Earned" }}
            secondaryStat={{ label: "XP Points", value: (analytics.stats.totalLessonsCompleted * 10).toString(), subValue: "Estimated" }}
            accentColor="bg-yellow-500"
          />
        </div>

      </div>
    </div>
  );
}
