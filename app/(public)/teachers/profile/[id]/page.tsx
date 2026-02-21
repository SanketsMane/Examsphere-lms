import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconStarFilled, IconMapPin, IconVideo, IconShieldCheck, IconMessageCircle, IconCalendar, IconClock } from "@tabler/icons-react";
import { BookingWidget } from "./_components/booking-widget";
import { constructS3Url } from "@/lib/s3-utils";

export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function TeacherProfilePage({ params }: Props) {
    const { id } = await params;

    const teacher = await prisma.teacherProfile.findUnique({
        where: { id },
        include: {
            user: true,
        }
    });

    if (!teacher) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid md:grid-cols-3 gap-8">

                    {/* Left Column: Sidebar Info */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                            <div className="relative w-32 h-32 mx-auto mb-4">
                                <Image
                                    src={teacher.user.image ? constructS3Url(teacher.user.image) : "https://github.com/shadcn.png"}
                                    alt={teacher.user.name || "Instructor"}
                                    fill
                                    className="object-cover rounded-full border-4 border-blue-50 dark:border-blue-900"
                                />
                                {teacher.isVerified && (
                                    <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-800">
                                        <IconShieldCheck className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{teacher.user.name}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{teacher.expertise[0] || "Instructor"}</p>

                            <div className="flex items-center justify-center gap-2 mb-6">
                                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-3 py-1 rounded-full text-sm font-semibold">
                                    <IconStarFilled className="w-4 h-4" />
                                    <span>{teacher.rating?.toFixed(1) || "5.0"}</span>
                                    <span className="text-slate-400 font-normal">({teacher.totalReviews})</span>
                                </div>
                                {teacher.experience && (
                                    <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                                        <IconVideo className="w-4 h-4" />
                                        <span>{teacher.experience} Yrs Exp.</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700 pt-4 mb-6">
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-slate-900 dark:text-white">{teacher.totalStudents}+</span>
                                    <span className="text-xs text-slate-500">Students</span>
                                </div>
                                <div className="text-center border-l border-slate-100 dark:border-slate-700">
                                    <span className="block text-lg font-bold text-slate-900 dark:text-white">100%</span>
                                    <span className="text-xs text-slate-500">Response</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <BookingWidget
                                    teacher={{
                                        id: teacher.id,
                                        name: teacher.user.name || "Instructor",
                                        image: teacher.user.image ? constructS3Url(teacher.user.image) : "",
                                        headline: teacher.expertise[0] || "Expert Instructor",
                                        hourlyRate: teacher.hourlyRate || 5000
                                    }}
                                />
                                <Link href={`/dashboard/messages?createChatWith=${teacher.user.id}`} className="w-full">
                                    <Button variant="outline" className="w-full">
                                        <IconMessageCircle className="w-4 h-4 mr-2" />
                                        Message
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Availability</h3>
                            <div className="space-y-3">
                                {/* Simple placeholder for availability */}
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <IconCalendar className="w-4 h-4 text-blue-500" />
                                    <span>Mon - Fri, 9:00 AM - 5:00 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">About Me</h2>
                            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
                                <p>{teacher.bio || "No biography provided."}</p>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Expertise</h3>
                                <div className="flex flex-wrap gap-2">
                                    {teacher.expertise.map((skill) => (
                                        <Badge key={skill} variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Languages</h3>
                                <div className="flex flex-wrap gap-2">
                                    {teacher.languages.map((lang) => (
                                        <span key={lang} className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-lg text-sm">
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Upcoming Live Sessions Section */}
                <div className="md:col-span-3 mt-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Upcoming Live Sessions</h2>
                    
                    {/* Fetch sessions for this teacher */}
                    {await (async () => {
                        const upcomingSessions = await prisma.liveSession.findMany({
                            where: {
                                teacherId: teacher.id,
                                status: 'scheduled',
                                scheduledAt: {
                                    gte: new Date()
                                }
                            },
                            orderBy: {
                                scheduledAt: 'asc'
                            },
                            take: 3
                        });

                        if (upcomingSessions.length === 0) {
                            return (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                                    <p className="text-slate-500 dark:text-slate-400">No upcoming sessions scheduled at the moment.</p>
                                    <p className="text-sm text-slate-400 mt-2">Check back later or request a specific time!</p>
                                </div>
                            );
                        }

                        // We need to import SessionCard here or create a simple version if imports are tricky in async block.
                        // Since this is a server component, we can layout the cards directly or use a client component wrapper.
                        // Let's use a server-friendly rendering of the session card style.
                        
                        return (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcomingSessions.map(session => (
                                    <Link href={`/live-sessions/${session.id}`} key={session.id} className="group">
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group-hover:border-blue-200 dark:group-hover:border-blue-900">
                                            <div className="relative h-48 bg-slate-100 dark:bg-slate-900">
                                                {/* Placeholder Image or specific session image if available */}
                                                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                                    <IconVideo className="w-12 h-12" />
                                                </div>
                                                <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                                    Live
                                                </div>
                                                <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
                                                    <IconCalendar className="w-4 h-4" />
                                                    {new Date(session.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(session.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <div className="p-5 space-y-4">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                        {session.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2.5em]">
                                                        {session.description || "Join this interactive live session to learn and grow."}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <IconClock className="w-4 h-4" />
                                                        <span>{session.duration} min</span>
                                                    </div>
                                                    <div className="font-bold text-lg text-slate-900 dark:text-white">
                                                        {session.price === 0 ? (
                                                            <span className="text-green-600">Free</span>
                                                        ) : (
                                                            // Simple formatting since we don't have helper here easily without importing
                                                            `$${(session.price / 100).toFixed(2)}` 
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <Button className="w-full bg-slate-900 text-white hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-100 rounded-xl font-bold">
                                                    Book Now
                                                </Button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
