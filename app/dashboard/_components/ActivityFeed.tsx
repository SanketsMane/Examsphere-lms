import { CheckCircle2, BookOpen, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: 'enrollment' | 'progress' | 'session';
  title: string;
  subtitle: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: {
    recentEnrollments: any[];
    recentProgress: any[];
    recentSessions: any[];
  };
}

type ActivitySource = ActivityFeedProps["activities"];

export function buildActivities(activities: ActivitySource): ActivityItem[] {
  return [
    ...activities.recentEnrollments.map(e => ({
      id: e.id,
      type: 'enrollment' as const,
      title: `Enrolled in ${e.Course?.title ?? "a course"}`,
      subtitle: 'New course started',
      timestamp: new Date(e.createdAt),
    })),
    ...activities.recentProgress.map(p => ({
      id: p.id,
      type: 'progress' as const,
      title: `Completed ${p.Lesson?.title ?? "a lesson"}`,
      subtitle: p.Lesson?.Chapter?.Course?.title ?? "",
      timestamp: new Date(p.updatedAt),
    })),
    // recentSessions are LiveSession rows, so the title is on the row itself
    ...activities.recentSessions.map(s => ({
      id: s.id,
      type: 'session' as const,
      title: `Session booked: ${s.title || 'Private Session'}`,
      subtitle: `With ${s.teacher?.user?.name || 'Instructor'}`,
      timestamp: new Date(s.createdAt),
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
}

/** Renders the list only; the dashboard wraps it in its own Panel. */
export function ActivityFeed({ activities }: ActivityFeedProps) {
  const allActivities = buildActivities(activities);

  if (allActivities.length === 0) return null;

  return (
    <ul className="-my-2 divide-y divide-border">
      {allActivities.map((activity, idx) => (
        <li key={activity.id + idx} className="py-3">
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
                <p className="text-sm font-semibold truncate">
                  {activity.title}
                </p>
                <span className="text-[10px] text-muted-foreground font-medium shrink-0 ml-2">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
              {activity.subtitle && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {activity.subtitle}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
