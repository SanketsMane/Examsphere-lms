import { requireTeacher } from "../data/auth/require-roles";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getSessionWithRole } from "../data/auth/require-roles";
import { adminGetCourses } from "../data/admin/admin-get-courses";
import { RevenueCard } from "@/components/dashboard/yo-coach/revenue-card";
import { StatBox } from "@/components/dashboard/yo-coach/stat-box";
import { ChartSection } from "@/components/dashboard/yo-coach/chart-section";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { BookOpen, Users, Wallet, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

import { formatPrice } from "@/lib/currency"; // Added for localization - Author: Sanket

import { getTeacherAnalytics } from "../actions/analytics";

export default async function TeacherDashboardPage() {
  const session = await getSessionWithRole();
  if (!session?.user?.id) redirect("/login");

  const userCountry = (session.user as any).country || "India";

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!teacherProfile) {
    // No profile -> register
    redirect("/register/teacher");
  }

  if (!teacherProfile.isApproved) {
    // Not approved -> verification
    redirect("/teacher/verification");
  }

  // await requireTeacher(); // Assuming this is handled layout/middleware or check below
  // Transform revenue data for chart
  const { stats, topReview, revenueData } = await getTeacherAnalytics();

  const chartData = revenueData.map(item => ({
    date: item.month,
    revenue: item.revenue / 100 // Convert cents to dollars/rupees
  }));

  // Earnings Data
  const earningsStats = [
    {
      title: "Total Earnings",
      amount: formatPrice(stats.totalEarnings, userCountry),
      icon: <Wallet className="h-5 w-5" />,
      variant: "blue" as const,
      subTitle: "Lifetime earnings"
    },
    {
      title: "Pending Payout",
      amount: formatPrice(Number(stats.pendingPayouts), userCountry),
      icon: <Clock className="h-5 w-5" />,
      variant: "orange" as const,
      subTitle: Number(stats.pendingPayouts) > 0 ? "Processing soon" : "No pending payouts"
    },
    {
      title: "Lifetime Students",
      amount: stats.studentsCount.toString(),
      icon: <Users className="h-5 w-5" />,
      variant: "purple" as const,
      subTitle: `Across ${stats.coursesCreated} courses`
    }
  ];

  const contentStats = [
    {
      title: "My Content",
      main: { label: "Total Courses", value: stats.coursesCreated.toString(), subValue: `${stats.totalEnrollments} Enrollments` },
      secondary: { label: "Blog Posts", value: stats.blogPostsCount.toString(), subValue: "Published articles" },
      color: "bg-blue-600"
    },
    {
      title: "Engagement",
      main: { label: "Avg Rating", value: stats.averageRating.toFixed(1), subValue: "Student reviews" },
      secondary: { label: "Sessions", value: stats.sessionsCompleted.toString(), subValue: "Completed" },
      color: "bg-orange-500"
    },
    {
      title: "Live Sessions",
      main: { label: "Sessions", value: stats.sessionsCompleted.toString(), subValue: "Completed" },
      secondary: { label: "Upcoming", value: stats.upcomingSessions.toString(), subValue: "Check Calendar" },
      color: "bg-purple-600"
    }
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 container mx-auto bg-gray-50/50 dark:bg-black/50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Instructor Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back! Here's your performance overview.</p>
        </div>
        <Link href="/teacher/courses/create">
          <Button>Create New Course</Button>
        </Link>
      </div>

      {/* 1. Earnings Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {earningsStats.map((stat, i) => (
          <RevenueCard key={i} {...stat} />
        ))}
      </div>

      {/* 2. Content Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contentStats.map((stat, i) => (
          <StatBox
            key={i}
            title={stat.title}
            mainStat={stat.main}
            secondaryStat={stat.secondary}
            accentColor={stat.color}
          />
        ))}
      </div>

      {/* 3. Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartSection
          title="Earnings Statistics"
          tabs={["Revenue"]}
          activeTab="Revenue"
          className="lg:col-span-2 bg-white dark:bg-card"
        >
          <ChartAreaInteractive
            data={chartData}
            dataKey="revenue"
            label="Revenue"
            color="#2563eb"
          />
        </ChartSection>

        {/* Right Side Widgets */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border-none">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Top Review
            </h3>
            {topReview ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300 italic mb-4">"{topReview.comment || "No comment provided."}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {topReview.reviewer.image && <img src={topReview.reviewer.image} alt={topReview.reviewer.name || ""} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{topReview.reviewer.name || "Anonymous"}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(topReview.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}