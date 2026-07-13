import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionWithRole } from "../data/auth/require-roles";
import { getTeacherAnalytics } from "../actions/analytics";
import { formatPrice } from "@/lib/currency";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { PageHeader, StatCard, Panel } from "@/components/dashboard/es/dashboard-kit";
import {
  Wallet,
  Users,
  BookOpen,
  Clock,
  Star,
  GraduationCap,
  Video,
  CalendarClock,
  Plus,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const session = await getSessionWithRole();
  if (!session?.user?.id) redirect("/login");

  const userCountry = (session.user as any).country || "India";

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!teacherProfile) redirect("/register/teacher");
  if (!teacherProfile.isApproved) redirect("/teacher/verification");

  const { stats, topReview, revenueData } = await getTeacherAnalytics();
  const chartData = revenueData.map((item) => ({ date: item.month, revenue: item.revenue / 100 }));
  const firstName = session.user.name?.split(" ")[0] || "there";

  const secondary = [
    { icon: Star, label: "Avg Rating", value: stats.averageRating.toFixed(1), hint: "Student reviews", accent: "orange" as const },
    { icon: GraduationCap, label: "Enrollments", value: stats.totalEnrollments.toString(), hint: `Across ${stats.coursesCreated} courses`, accent: "green" as const },
    { icon: Video, label: "Sessions Done", value: stats.sessionsCompleted.toString(), hint: "Completed", accent: "sky" as const },
    { icon: CalendarClock, label: "Upcoming", value: stats.upcomingSessions.toString(), hint: "Check calendar", accent: "violet" as const },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome back, ${firstName}`} subtitle="Here's how your teaching is performing.">
        <Link
          href="/teacher/courses/create"
          className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-navy-950"
        >
          <Plus className="size-4" /> Create Course
        </Link>
      </PageHeader>

      {/* Primary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Wallet} accent="navy" label="Total Earnings" value={formatPrice(stats.totalEarnings, userCountry)} hint="Lifetime" />
        <StatCard icon={Users} accent="sky" label="Lifetime Students" value={stats.studentsCount.toString()} hint={`${stats.coursesCreated} courses`} />
        <StatCard icon={BookOpen} accent="orange" label="Courses" value={stats.coursesCreated.toString()} hint={`${stats.blogPostsCount} blog posts`} />
        <StatCard
          icon={Clock}
          accent="violet"
          label="Pending Payout"
          value={formatPrice(Number(stats.pendingPayouts), userCountry)}
          hint={Number(stats.pendingPayouts) > 0 ? "Processing soon" : "All settled"}
        />
      </div>

      {/* Chart + side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Earnings Statistics" icon={Wallet} className="lg:col-span-2" bodyClassName="p-2 sm:p-4">
          <ChartAreaInteractive data={chartData} dataKey="revenue" label="Revenue" color="#0F2557" />
        </Panel>

        <Panel title="Top Review" icon={Star}>
          {topReview ? (
            <div>
              <p className="mb-4 text-sm italic text-ink-700 dark:text-muted-foreground">
                &ldquo;{topReview.comment || "No comment provided."}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="size-9 overflow-hidden rounded-full bg-bg-soft dark:bg-muted">
                  {topReview.reviewer.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={topReview.reviewer.image} alt={topReview.reviewer.name || ""} className="size-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-950 dark:text-white">{topReview.reviewer.name || "Anonymous"}</p>
                  <p className="text-xs text-ink-500 dark:text-muted-foreground">
                    {new Date(topReview.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-ink-500 dark:text-muted-foreground">No reviews yet.</p>
          )}
        </Panel>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {secondary.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
    </div>
  );
}
