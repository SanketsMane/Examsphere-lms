import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck, 
  Wallet, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  IndianRupee,
  Users,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { getVerificationStats, getRecentVerificationActivity } from "@/app/data/admin/verification-data";
import { pendingTeacherWhere } from "@/app/admin/_lib/teacher-approval";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VerificationCenterPage() {
  await requireAdmin();

  const [stats, recentActivity, pendingTeachers] = await Promise.all([
    getVerificationStats(),
    getRecentVerificationActivity(),
    // Same queue as the Profile Verification page, incl. teachers with no record yet.
    prisma.teacherProfile.count({ where: pendingTeacherWhere }),
  ]);

  const formatRelativeTime = (date: Date | null) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Verification Center</h1>
        <p className="text-muted-foreground">
          Manage teacher profile verifications and payout requests
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Verifications
            </CardTitle>
            <UserCheck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payouts
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayouts}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verified Teachers
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Active verified teachers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Payouts
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(Number(stats.monthlyPayouts) || 0)}</div>
            <p className="text-xs text-muted-foreground">
              This month's total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Verification */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Profile Verification
                </CardTitle>
                <CardDescription>
                  Review and verify teacher profiles, qualifications, and identity documents
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {pendingTeachers} Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Identity</span>
                  <span className="font-medium">{stats.verificationBreakdown?.identity || 0} pending</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Qualifications</span>
                  <span className="font-medium">{stats.verificationBreakdown?.qualifications || 0} pending</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium">{stats.verificationBreakdown?.experience || 0} pending</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Background</span>
                  <span className="font-medium">{stats.verificationBreakdown?.background || 0} pending</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button asChild className="flex-1">
                <Link href="/admin/verification/profiles">
                  Review Profiles
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/verification/profiles?tab=approved">
                  View Verified
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payout System */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  Payout System
                </CardTitle>
                <CardDescription>
                  Process teacher payout requests and manage earnings distribution
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {stats.pendingPayouts} Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Under Review</span>
                  <span className="font-medium">{stats.payoutBreakdown?.underReview || 0} requests</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Approved</span>
                  <span className="font-medium">{stats.payoutBreakdown?.approved || 0} requests</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="font-medium">{formatMoney(Number(stats.payoutBreakdown?.totalValue) || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg Request</span>
                  <span className="font-medium">{formatMoney(Math.round(Number(stats.payoutBreakdown?.avgRequest) || 0))}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button asChild className="flex-1">
                <Link href="/admin/verification/payouts">
                  Process Payouts
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/verification/payouts?tab=processed">
                  View History
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest verification and payout activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`p-2 rounded-full ${
                  activity.type === 'verification' 
                    ? activity.status === 'Approved' ? 'bg-green-100' : 'bg-red-100'
                    : 'bg-blue-100'
                }`}>
                  {activity.type === 'verification' ? (
                    activity.status === 'Approved' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )
                  ) : (
                    <IndianRupee className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {activity.type === 'verification' 
                      ? `Teacher verification ${activity.status.toLowerCase()}`
                      : 'Payout processed'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.teacherName}
                    {activity.amount ? ` • ${formatMoney(Number(activity.amount))}` : null}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}