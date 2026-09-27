import { requireTeacher } from "../../data/auth/require-roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, TrendingUp, Book, MonitorPlay, IndianRupee, Activity } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { getTeacherAnalytics } from "@/app/data/teacher/get-teacher-analytics";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function TeacherAnalyticsPage() {
  await requireTeacher();

  const session = await auth.api.getSession({ headers: await headers() });
  const analytics = await getTeacherAnalytics(session!.user!.id);

  return (
    <div className="space-y-8 p-1">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-900 to-blue-600 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
          Analytics Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Deep insights into your teaching performance and student growth.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {analytics.studentGrowth >= 0 ?
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> :
                <TrendingUp className="h-3 w-3 text-red-500 mr-1 rotate-180" />
              }
              <span className={analytics.studentGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(analytics.studentGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-full">
              <Book className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {analytics.courseGrowth >= 0 ?
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> :
                <TrendingUp className="h-3 w-3 text-red-500 mr-1 rotate-180" />
              }
              <span className={analytics.courseGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(analytics.courseGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">new this month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {analytics.engagementGrowth >= 0 ?
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> :
                <TrendingUp className="h-3 w-3 text-red-500 mr-1 rotate-180" />
              }
              <span className={analytics.engagementGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(analytics.engagementGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">vs last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Earnings</CardTitle>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-full">
              <IndianRupee className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(analytics.totalRevenue, "India")}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {analytics.revenueGrowth >= 0 ?
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> :
                <TrendingUp className="h-3 w-3 text-red-500 mr-1 rotate-180" />
              }
              <span className={analytics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(analytics.revenueGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Course Revenue</CardTitle>
            <CardDescription>
              Earnings over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive
              data={analytics.graphData}
              dataKey="revenue"
              label="Revenue (₹)"
              color="var(--chart-1)"
            />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Student Enrollments</CardTitle>
            <CardDescription>
              New students over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive
              data={analytics.graphData}
              dataKey="students"
              label="New Students"
              color="var(--chart-2)"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
