import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconFileText, IconDownload, IconCalendar } from "@tabler/icons-react";
import { formatPrice } from "@/lib/currency"; // Added for localization - Author: Sanket
import { getSessionWithRole, requireAdmin } from "@/app/data/auth/require-roles"; // Added for localization - Author: Sanket // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getSessionWithRole();
  const userCountry = (session?.user as any)?.country || "India";

  const reports = [
    { name: 'User Registration Report', description: 'Monthly user sign-ups', date: '2025-12-25' },
    { name: 'Revenue Report', description: 'Monthly revenue breakdown', date: '2025-12-25' },
    { name: 'Course Performance', description: 'Top performing courses', date: '2025-12-24' },
    { name: 'Teacher Activity', description: 'Teacher engagement metrics', date: '2025-12-23' },
    { name: 'Student Progress', description: 'Student completion rates', date: '2025-12-22' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <IconFileText className="h-8 w-8" />
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground">Generate and download platform reports</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Generate New Report</CardTitle>
            <CardDescription>Create custom reports for specific date ranges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full">Generate User Report</Button>
            <Button className="w-full" variant="outline">Generate Revenue Report</Button>
            <Button className="w-full" variant="outline">Generate Course Report</Button>
            <Button className="w-full" variant="outline">Generate Custom Report</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Platform statistics at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">This Month Revenue</span>
              <span className="font-medium">{formatPrice(0, userCountry)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">New Users</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Active Courses</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Live Sessions</span>
              <span className="font-medium">0</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <IconFileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <IconCalendar className="h-4 w-4" />
                    {report.date}
                  </span>
                  <Button variant="outline" size="sm">
                    <IconDownload className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
