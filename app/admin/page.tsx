import { getPlatformAnalytics } from "../actions/analytics";
import { AdminChartSection } from "@/components/admin/AdminChartSection";
import { formatPrice } from "@/lib/currency";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { PageHeader, StatCard, Panel } from "@/components/dashboard/es/dashboard-kit";
import {
  Wallet,
  Users,
  BookOpen,
  CreditCard,
  GraduationCap,
  Radio,
  TrendingUp,
  FileText,
  Activity,
  ServerCog,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const { stats, revenueOverTime } = await getPlatformAnalytics();
  const userCountry = (session?.user as any)?.country || "India";
  const serverTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  const secondary = [
    { icon: GraduationCap, label: "Enrollments", value: stats.totalEnrollments.toString(), accent: "green" as const },
    { icon: Radio, label: "Live Sessions", value: stats.liveSessions.toString(), hint: `${stats.totalSessions} total`, accent: "orange" as const },
    { icon: TrendingUp, label: "Conversion", value: `${stats.conversionRate}%`, hint: "Visitors → enrolled", accent: "sky" as const },
    { icon: FileText, label: "Blog Posts", value: stats.totalBlogPosts.toString(), hint: "Published", accent: "violet" as const },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Admin Dashboard" subtitle="Platform performance at a glance." />

      {/* Primary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Wallet} accent="navy" label="Total Revenue" value={formatPrice(stats.totalRevenue, userCountry)} hint="Lifetime gross" />
        <StatCard icon={Users} accent="sky" label="Total Users" value={stats.totalUsers.toString()} hint={`${stats.activeUsers} active`} />
        <StatCard icon={BookOpen} accent="orange" label="Total Courses" value={stats.totalCourses.toString()} hint={`${stats.totalEnrollments} enrollments`} />
        <StatCard icon={CreditCard} accent="violet" label="Pending Payouts" value={formatPrice(Number(stats.pendingPayouts), userCountry)} hint="Awaiting release" />
      </div>

      {/* Chart + side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminChartSection
            data={revenueOverTime.map((item) => ({ date: item.month, revenue: item.revenue / 100 }))}
          />
        </div>

        <div className="space-y-6">
          {/* System status */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-950 to-navy-700 p-6 text-white shadow-[var(--shadow-es-md)]">
            <div className="relative z-10">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> Live
              </div>
              <h3 className="font-display text-lg font-bold">System Status</h3>
              <p className="mt-1 text-sm text-slate-300">Database connected &amp; operational</p>
              <p className="mt-4 text-xs text-slate-400">Server time: {serverTime} IST</p>
            </div>
            <ServerCog className="absolute -bottom-4 -right-4 size-28 text-white/10" />
          </div>

          {/* Engagement freebies */}
          <Panel title="Free Trials Claimed" icon={Activity}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-muted-foreground">Free Demos</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-navy-950 dark:text-white">{stats.freeDemosUsed}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-muted-foreground">Free Groups</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-navy-950 dark:text-white">{stats.freeGroupsUsed}</p>
              </div>
            </div>
          </Panel>
        </div>
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
