import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Video, 
  Award,
  DollarSign,
  Clock,
  Target,
  Activity,
  Calendar,
  MessageSquare
} from "lucide-react";
import { getUserAnalytics, getTeacherAnalytics } from "@/app/actions/analytics";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getSessionWithRole();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your learning progress and performance metrics
          </p>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="student" className="space-y-6">
        <TabsList>
          <TabsTrigger value="student">Student Analytics</TabsTrigger>
          <TabsTrigger value="teacher">Teacher Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="student" className="space-y-6">
          <Suspense fallback={<AnalyticsLoadingSkeleton />}>
            <StudentAnalytics userId={session?.user?.id || ""} />
          </Suspense>
        </TabsContent>

        <TabsContent value="teacher" className="space-y-6">
          <Suspense fallback={<AnalyticsLoadingSkeleton />}>
            <TeacherAnalytics />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function StudentAnalytics({ userId }: { userId: string }) {
  const analytics = await getUserAnalytics(userId);

  return (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Courses Enrolled"
          value={(analytics.stats?.enrollmentCount ?? 0).toString()}
          icon={<BookOpen className="h-4 w-4" />}
          change="+12% from last month"
          changeType="positive"
        />
        <MetricCard
          title="Completed Courses"
          value={(analytics.stats?.completedCourses ?? 0).toString()}
          icon={<Award className="h-4 w-4" />}
          subtitle={`${analytics.stats?.completionRate ?? 0}% completion rate`}
        />
        <MetricCard
          title="Live Sessions"
          value={(analytics.stats?.totalSessionsBooked ?? 0).toString()}
          icon={<Video className="h-4 w-4" />}
          subtitle={`${analytics.stats?.completedSessions ?? 0} completed`}
        />
        <MetricCard
          title="Lessons Completed"
          value={(analytics.stats?.totalLessonsCompleted ?? 0).toString()}
          icon={<Target className="h-4 w-4" />}
          change="+23% from last month"
          changeType="positive"
        />
      </div>

      {/* Learning Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.learningProgress.slice(0, 5).map((progress: any) => (
              <div key={progress.courseId} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium truncate">{progress.courseTitle}</h4>
                  <Badge variant="outline" className="text-xs">
                    {progress.progress}%
                  </Badge>
                </div>
                <Progress value={progress.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progress.completedLessons}/{progress.totalLessons} lessons</span>
                  <span>
                    {progress.completedAt 
                      ? "Completed" 
                      : `Started ${format(new Date(progress.enrolledAt), "MMM dd")}`
                    }
                  </span>
                </div>
              </div>
            ))}
            
            {analytics.learningProgress.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2" />
                <p>No courses enrolled yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent Enrollments */}
              {analytics.recentActivity.recentEnrollments.slice(0, 3).map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Enrolled in course</p>
                    <p className="text-xs text-muted-foreground">{enrollment.course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(enrollment.enrolledAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Recent Progress */}
              {analytics.recentActivity.recentProgress.slice(0, 2).map((progress: any) => (
                <div key={progress.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded">
                    <Award className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Completed lesson</p>
                    <p className="text-xs text-muted-foreground">{progress.Lesson.title}</p>
                    <p className="text-xs text-muted-foreground">
                      in {progress.Lesson.Chapter.Course.title}
                    </p>
                  </div>
                </div>
              ))}

              {analytics.recentActivity.recentEnrollments.length === 0 && 
               analytics.recentActivity.recentProgress.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            30-Day Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.engagementMetrics.lessonsCompletedLast30Days}
              </div>
              <p className="text-sm text-muted-foreground">Lessons Completed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analytics.engagementMetrics.sessionsLast30Days}
              </div>
              <p className="text-sm text-muted-foreground">Live Sessions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analytics.engagementMetrics.messagesLast30Days}
              </div>
              <p className="text-sm text-muted-foreground">Messages Sent</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

async function TeacherAnalytics() {
  try {
    const analytics = await getTeacherAnalytics();

    return (
      <>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Students"
            value={(analytics.stats?.studentsCount ?? 0).toString()}
            icon={<Users className="h-4 w-4" />}
            change="+15% from last month"
            changeType="positive"
          />
          <MetricCard
            title="Total Earnings"
            value={`$${((analytics.stats?.totalEarnings ?? 0) / 100).toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4" />}
            change="+28% from last month"
            changeType="positive"
          />
          <MetricCard
            title="Courses Created"
            value={(analytics.stats?.coursesCreated ?? 0).toString()}
            icon={<BookOpen className="h-4 w-4" />}
            subtitle={`${analytics.stats?.totalEnrollments ?? 0} total enrollments`}
          />
          <MetricCard
            title="Average Rating"
            value={(analytics.stats?.averageRating ?? 0).toFixed(1)}
            icon={<Award className="h-4 w-4" />}
            subtitle="from student reviews"
          />
        </div>

        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Course Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.coursePerformance.slice(0, 5).map((course: any) => (
                <div key={course.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{course.title}</h4>
                    <Badge variant="secondary">
                      ${(course.revenue / 100).toFixed(0)} revenue
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Enrollments:</span>
                      <span className="ml-2 font-medium">{course.enrollments}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reviews:</span>
                      <span className="ml-2 font-medium">{course.reviews}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rating:</span>
                      <span className="ml-2 font-medium">{course.averageRating.toFixed(1)} ⭐</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {analytics.coursePerformance.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <p>No courses created yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Revenue chart would be displayed here</p>
                <p className="text-sm text-muted-foreground">
                  Total: ${(analytics.stats.totalEarnings / 100).toFixed(2)} across {analytics.revenueData.length} months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  } catch (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Teacher Analytics Not Available</h3>
          <p className="text-muted-foreground">
            You need to have a teacher profile to view teaching analytics.
          </p>
        </CardContent>
      </Card>
    );
  }
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  change, 
  changeType, 
  subtitle 
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: "positive" | "negative";
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {change && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                changeType === "positive" ? "text-green-600" : "text-red-600"
              }`}>
                <TrendingUp className="h-3 w-3" />
                {change}
              </p>
            )}
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}