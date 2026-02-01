import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, BookOpen, Calendar, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: 'enrollment' | 'progress' | 'session';
  title: string;
  subtitle: string;
  timestamp: Date;
  link?: string;
}

interface ActivityFeedProps {
  activities: {
    recentEnrollments: any[];
    recentProgress: any[];
    recentSessions: any[];
  };
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  // Combine and sort activities
  const allActivities: ActivityItem[] = [
    ...activities.recentEnrollments.map(e => ({
      id: e.id,
      type: 'enrollment' as const,
      title: `Enrolled in ${e.Course.title}`,
      subtitle: 'New course started',
      timestamp: new Date(e.createdAt),
      link: `/courses/${e.Course.id}`
    })),
    ...activities.recentProgress.map(p => ({
      id: p.id,
      type: 'progress' as const,
      title: `Completed ${p.Lesson.title}`,
      subtitle: p.Lesson.Chapter.Course.title,
      timestamp: new Date(p.updatedAt),
      link: `/courses/${p.Lesson.Chapter.Course.id}`
    })),
    ...activities.recentSessions.map(s => ({
      id: s.id,
      type: 'session' as const,
      title: `Scheduled session for ${s.session?.title || 'Private Session'}`,
      subtitle: `With ${s.teacher?.user?.name || 'Instructor'}`,
      timestamp: new Date(s.createdAt),
      link: `/dashboard/sessions`
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

  if (allActivities.length === 0) return null;

  return (
    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 py-3 px-4 flex flex-row items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          Recent Activity
        </CardTitle>
        <Link href="/dashboard/courses" className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5">
          View All <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {allActivities.map((activity, idx) => (
            <li key={activity.id + idx} className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
              <div className="flex gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  activity.type === 'enrollment' ? "bg-blue-100 text-blue-600" :
                  activity.type === 'progress' ? "bg-green-100 text-green-600" :
                  "bg-purple-100 text-purple-600"
                )}>
                  {activity.type === 'enrollment' ? <BookOpen className="h-4 w-4" /> :
                   activity.type === 'progress' ? <CheckCircle2 className="h-4 w-4" /> :
                   <Calendar className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {activity.title}
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-2">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {activity.subtitle}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
