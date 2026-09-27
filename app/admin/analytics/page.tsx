import { requireAdmin } from "../../data/admin/require-admin";
import { adminGetAnalyticsStats } from "../../data/admin/admin-get-analytics-stats";
import { adminGetEnrollmentStats } from "../../data/admin/admin-get-enrollment-stats";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  IconTrendingUp, 
  IconUsers, 
  IconBook, 
  IconCertificate,
  IconChartBar,
  IconEye,
  IconClock
} from "@tabler/icons-react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  
  const analyticsData = await adminGetAnalyticsStats();
  const enrollmentData = await adminGetEnrollmentStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your LMS performance
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(analyticsData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {analyticsData.totalEnrollments} enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <IconBook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Available courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <IconCertificate className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Average lesson completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconChartBar className="h-5 w-5" />
            Enrollment Trends
          </CardTitle>
          <CardDescription>
            Monthly enrollment statistics over the past year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartAreaInteractive data={enrollmentData} />
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconEye className="h-5 w-5" />
              Top Performing Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.topPerformingCourses.slice(0, 3).map((course, index) => (
              <div key={course.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <Link 
                    href={`/admin/courses/${course.id}`}
                    className="text-sm hover:underline"
                  >
                    {course.title}
                  </Link>
                </div>
                <span className="text-sm text-muted-foreground">
                  {course.enrollments} enrollments
                </span>
              </div>
            ))}
            {analyticsData.topPerformingCourses.length === 0 && (
              <p className="text-sm text-muted-foreground">No courses available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconClock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user} enrolled in {activity.course}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {analyticsData.recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}