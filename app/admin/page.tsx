import { getPlatformAnalytics } from "../actions/analytics";
import { AdminChartSection } from "@/components/admin/AdminChartSection";
import { RevenueCard } from "@/components/dashboard/yo-coach/revenue-card";
import { StatBox } from "@/components/dashboard/yo-coach/stat-box";
import { LayoutDashboard, Wallet, MonitorPlay, CreditCard, Ticket } from "lucide-react";
import { formatPrice } from "@/lib/currency"; // Added for localization - Author: Sanket
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const { stats, revenueOverTime } = await getPlatformAnalytics();

  const userCountry = (session?.user as any)?.country || "India";

  // Mapped Data
  const revenueStats = [
    {
      title: "Total Revenue",
      amount: formatPrice(stats.totalRevenue, userCountry),
      icon: <Wallet className="h-5 w-5" />,
      variant: "blue" as const
    },
    {
      title: "Course Sales",
      amount: formatPrice(stats.totalRevenue, userCountry),
      icon: <MonitorPlay className="h-5 w-5" />,
      variant: "orange" as const
    },
    {
      title: "Pending Payouts",
      amount: formatPrice(Number(stats.pendingPayouts), userCountry),
      icon: <CreditCard className="h-5 w-5" />,
      variant: "purple" as const
    }
  ];

  const contentStats = [
    {
      title: "Users",
      main: { label: "Total Users", value: stats.totalUsers.toString(), subValue: `${stats.activeUsers} Active` },
      secondary: { label: "Conversion", value: `${stats.conversionRate}%`, subValue: "Enrolled" },
      color: "bg-blue-600"
    },
    {
      title: "Content",
      main: { label: "Total Courses", value: stats.totalCourses.toString(), subValue: `${stats.totalEnrollments} Enrollments` },
      secondary: { label: "Blog Posts", value: stats.totalBlogPosts.toString(), subValue: "Published" },
      color: "bg-orange-500"
    },
    {
      title: "Sessions",
      main: { label: "Total Sessions", value: stats.totalSessions.toString(), subValue: "Scheduled/Done" },
      secondary: { label: "Live Now", value: stats.liveSessions.toString(), subValue: "Active" },
      color: "bg-purple-600"
    }
  ];

  return (
    <div className="space-y-6 bg-gray-50/50 dark:bg-black/50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {revenueStats.map((stat, i) => (
          <RevenueCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <StatBox
            title="Free Demos"
            mainStat={{ label: "Claimed", value: stats.freeDemosUsed.toString(), subValue: "Students" }}
            secondaryStat={{ label: "Available", value: (stats.totalUsers - stats.freeDemosUsed).toString(), subValue: "Potential" }}
            accentColor="bg-teal-500"
          />
         <StatBox
            title="Free Group Classes"
            mainStat={{ label: "Claimed", value: stats.freeGroupsUsed.toString(), subValue: "Students" }}
            secondaryStat={{ label: "Available", value: (stats.totalUsers - stats.freeGroupsUsed).toString(), subValue: "Potential" }}
            accentColor="bg-cyan-500"
          />
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
        <AdminChartSection
          data={revenueOverTime.map(item => ({
            date: item.month,
            revenue: item.revenue / 100
          }))}
        />

        {/* Right Side Widgets */}
        <div className="space-y-6">
          <div className="bg-[#1e293b] text-white p-6 rounded-xl shadow-lg h-48 flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-1">System Status</h3>
              <p className="text-slate-300 text-sm">Database Connected & Operational</p>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-medium text-green-400">Live</span>
                </div>
                <p className="text-xs text-slate-400">Server Time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} IST</p>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10">
              <LayoutDashboard className="h-32 w-32 -mb-8 -mr-8" />
            </div>
          </div>

          <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border-none">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Ticket className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Enrollments</p>
                <h3 className="text-2xl font-bold">{stats.totalEnrollments}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
