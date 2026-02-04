import { getSessionWithRole } from "../data/auth/require-roles";
import { getUserAnalytics } from "../actions/analytics";
import { ScheduleWidget, QuickActions } from "@/components/dashboard/dashboard-widgets";
import { IconSparkles } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getEnrolledCourses } from "../data/user/get-enrolled-courses";
import { CourseProgressCard } from "./_components/CourseProgressCard";
import { FreeClassWidget } from "./_components/FreeClassWidget";
import { ActivityFeed } from "./_components/ActivityFeed";
import { Input } from "@/components/ui/input";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { ArrowRight, BookOpen, Target } from "lucide-react";
import { RevenueCard } from "@/components/dashboard/yo-coach/revenue-card";
import { StatBox } from "@/components/dashboard/yo-coach/stat-box";
import { ChartSection } from "@/components/dashboard/yo-coach/chart-section";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { getStudentSchedule } from "../data/student/get-student-schedule";
import { cn } from "@/lib/utils";

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
      icon: <Target className="h-5 w-5" />,
      variant: "orange" as const
    },
    {
      title: "Sessions Attended",
      amount: analytics.stats.completedSessions.toString(),
      subTitle: `${analytics.stats.totalSessionsBooked} booked total`,
      icon: <IconSparkles className="h-5 w-5" />,
      variant: "purple" as const
    }
  ];

  // Fetch current user with preferences for completion logic
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true }
  });

  const profileFields = [
    { label: "Avatar", value: !!session.user.image },
    { label: "Name", value: !!session.user.name },
    { label: "Role Set", value: !!session.user.role },
    { label: "Email Verified", value: true }, // Placeholder as auth usually handles this
  ];

  const completedFields = profileFields.filter(f => f.value).length;
  const completionPercentage = Math.round((completedFields / profileFields.length) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50/30 dark:bg-transparent min-h-screen">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <MotionWrapper variant="slideUp">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              Welcome back, {session.user.name?.split(' ')[0]}! <span className="text-3xl animate-bounce">👋</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              You've completed <span className="text-blue-600 dark:text-blue-400 font-bold">{analytics.stats.totalLessonsCompleted} lessons</span> so far. Keep it up!
            </p>
          </div>
        </MotionWrapper>
        
        <div className="flex items-center gap-3">
           <Link href="/courses">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 rounded-full font-bold">
              Browse Courses
            </Button>
           </Link>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Span 2) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Top Row Cards - Fixed Grid to 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topStats.map((stat, i) => (
              <MotionWrapper key={i} delay={i * 0.1} variant="scale">
                <div className="bg-white dark:bg-card p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group h-full">
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl transition-transform group-hover:scale-110",
                        stat.variant === "blue" ? "bg-blue-50 text-blue-600" :
                        stat.variant === "orange" ? "bg-orange-50 text-orange-600" :
                        "bg-purple-50 text-purple-600"
                      )}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                        <h4 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{stat.amount}</h4>
                      </div>
                   </div>
                   <p className="text-[10px] font-semibold text-gray-400 mt-3 flex items-center gap-1">
                      <IconSparkles className="h-3 w-3 text-yellow-400" /> {stat.subTitle}
                   </p>
                </div>
              </MotionWrapper>
            ))}
          </div>

          {/* Activity Section / Learning Progress - Stacked for better mobile/desktop flow */}
          <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Current Learning
                  </h3>
                  <Link href="/dashboard/courses" className="text-xs font-bold text-blue-600 hover:underline">
                    My Courses
                  </Link>
                </div>
                
                {enrolledCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enrolledCourses.slice(0, 4).map((enrollment: any) => (
                      <CourseProgressCard key={enrollment.Course.id} data={enrollment} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-card p-8 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Start Your Journey</h4>
                    <p className="text-sm text-gray-500 mb-4 max-w-md">You haven't enrolled in any courses yet. Browse our library to find the perfect course for you.</p>
                    <Link href="/courses">
                        <Button className="rounded-full font-bold bg-blue-600 hover:bg-blue-700 text-white px-8">
                          Browse Library
                        </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Activity Feed Widget */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Recent Activity
                    </h3>
                  </div>
                  <ActivityFeed activities={analytics.recentActivity} />
              </div>
          </div>

          {/* Interactive Chart Section */}
          <ChartSection title="Learning Consistency" className="bg-white dark:bg-card border border-gray-200 dark:border-gray-800">
            <ChartAreaInteractive data={analytics.activityData} dataKey="lessons" label="Lessons Completed" color="#3b82f6" />
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

           {/* Free Class Usage Widget */}
            <FreeClassWidget usage={freeUsage} />

          <ScheduleWidget items={scheduleItems} />

          {/* Quick Stats Box - Removed redundant Overview, kept Achievements */}
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
