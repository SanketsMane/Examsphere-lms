
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Calendar, Clock, Users, ArrowRight, Video } from 'lucide-react';
import { formatPriceSimple } from '@/lib/currency';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';

export async function UpcomingGroupClasses() {
  // Fetch from both tables to ensure visibility - Author: Sanket
  const [groupClasses, liveGroupSessions] = await Promise.all([
    prisma.groupClass.findMany({
      where: {
        status: 'Scheduled',
        scheduledAt: { gte: new Date() }
      },
      orderBy: { scheduledAt: 'asc' },
      take: 6,
      include: { teacher: { include: { user: true } } }
    }),
    prisma.liveSession.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: { gte: new Date() },
        maxParticipants: { gt: 1 } // Only show "group" sessions from live sessions table
      },
      orderBy: { scheduledAt: 'asc' },
      take: 6,
      include: { teacher: { include: { user: true } } }
    })
  ]);

  // Normalize and Combine
  const allSessions = [
    ...groupClasses.map(c => ({
      ...c,
      id: c.id,
      type: 'GroupClass',
      subjectName: c.subjectName,
      maxStudents: c.maxStudents
    })),
    ...liveGroupSessions.map(s => ({
      ...s,
      id: s.id,
      type: 'LiveSession',
      subjectName: (s as any).subject || 'General',
      maxStudents: (s as any).maxParticipants || 1
    }))
  ].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
   .slice(0, 6);

  if (allSessions.length === 0) return null;


  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
           <SectionHeading
            title="Upcoming Group Classes"
            description="Join interactive live sessions with expert instructors and peers."
            align="left"
          />
          <Link href="/live-sessions" className="hidden md:flex items-center text-primary font-bold hover:underline">
            View All <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allSessions.map((session) => (
            <Link href={`/live-sessions/${session.id}`} key={session.id} className="group block h-full">
              <div className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                {/* Image / Banner Placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                    {/* Could use session image if available, else standard gradient */}
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
                        <Video className="w-16 h-16" />
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur text-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {session.maxStudents} Seats
                    </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                   <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                      <span className="bg-primary/10 px-2 py-1 rounded">{session.subjectName || 'General'}</span>
                   </div>
                   
                   <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                     {session.title}
                   </h3>
                   
                   <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">
                     {session.description || "Join this interactive session to master new skills."}
                   </p>

                   <div className="flex items-center gap-3 mb-6">
                        {/* Teacher Avatar */}
                         <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative">
                            {session.teacher.user.image ? (
                                <img src={session.teacher.user.image} alt={session.teacher.user.name} className="object-cover w-full h-full" />
                            ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                    {session.teacher.user.name?.[0]}
                                </div>
                            )}
                         </div>
                         <div className="text-sm">
                            <p className="font-bold text-foreground">{session.teacher.user.name}</p>
                            <p className="text-xs text-muted-foreground">Instructor</p>
                         </div>
                   </div>

                   <div className="border-t border-border pt-4 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                         <div className="flex items-center text-sm text-foreground font-medium mb-1">
                            <Calendar className="w-4 h-4 mr-2 text-primary" />
                            {format(session.scheduledAt, 'MMM d, yyyy')}
                         </div>
                         <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 mr-2" />
                            {format(session.scheduledAt, 'h:mm a')} • {session.duration} min
                         </div>
                      </div>
                      
                      <div className="text-right">
                         <div className="text-lg font-bold text-primary">
                            {formatPriceSimple(session.price)}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
             <Link href="/live-sessions" className="btn btn-outline w-full">View All Classes</Link>
        </div>
      </div>
    </section>
  );
}
