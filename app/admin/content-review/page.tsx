import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconShieldCheck, IconCheck, IconX, IconClock } from "@tabler/icons-react";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function ContentReviewPage() {
  await requireAdmin();

  const pendingItems = [
    { id: 1, type: 'Course', title: 'Advanced JavaScript Patterns', teacher: 'John Doe', submitted: '2 hours ago' },
    { id: 2, type: 'Lesson', title: 'React Hooks Deep Dive', teacher: 'Jane Smith', submitted: '5 hours ago' },
    { id: 3, type: 'Course', title: 'Python for Data Science', teacher: 'Mike Johnson', submitted: '1 day ago' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <IconShieldCheck className="h-8 w-8" />
          Content Review
        </h1>
        <p className="text-muted-foreground">Review and approve courses and lessons</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Content Review</CardTitle>
          <CardDescription>Content awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{item.type}</Badge>
                    <p className="font-medium">{item.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">By: {item.teacher}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <IconClock className="h-3 w-3" />
                    Submitted {item.submitted}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Review</Button>
                  <Button variant="default" size="sm">
                    <IconCheck className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button variant="destructive" size="sm">
                    <IconX className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {pendingItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No content pending review</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
