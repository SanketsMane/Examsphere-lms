import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    BookOpen,
    Clock,
    Globe,
    Award,
    BarChart,
    CheckCircle2,
    PlayCircle,
    Lock,
    Star,
    User,
} from "lucide-react";
import { CoursePurchaseButton } from "./_components/CoursePurchaseButton";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket

import { CourseDescription } from "./_components/CourseDescription";

export default async function CourseDetailsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const session = await getSessionWithRole();

    const course = await prisma.course.findUnique({
        where: {
            slug: slug,
        },
        include: {
            user: {
                select: {
                    name: true,
                    image: true,
                    teacherProfile: true
                }
            },
            chapter: {
                orderBy: {
                    position: "asc",
                },
                include: {
                    lessons: {
                        orderBy: {
                            position: "asc",
                        },
                    },
                },
            }, enrollment: {
                where: {
                    userId: session?.user.id
                }
            }
        },
    });

    if (!course) {
        notFound();
    }

    const isPurchased = course.enrollment.length > 0;
    // If user is the author, treat as purchased
    const isOwner = session?.user.id === course.userId;
    const canAccess = isPurchased || isOwner || (session?.user as any)?.role === "admin";

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Section */}
            {/* Hero Section */}
            <div className="relative bg-slate-900 text-white pt-12 pb-24 md:pt-16 md:pb-32 overflow-hidden">
                {/* Background Banner */}
                {course.fileKey && (
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={`https://utfs.io/f/${course.fileKey}`}
                            alt={course.title}
                            fill
                            className="object-cover opacity-20 blur-sm scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/60" />
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10 relative z-10">
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 text-primary-foreground/80 text-sm font-semibold tracking-wide uppercase">
                            <Link href="/courses" className="hover:underline hover:text-primary">Courses</Link>
                            <span>/</span>
                            <span>{course.category}</span>
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight shadow-black/50 drop-shadow-md">
                            {course.title}
                        </h1>

                        <p className="text-lg text-slate-200 line-clamp-2 drop-shadow-sm">
                            {course.smallDescription}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200 font-medium">
                            {course.level && (
                                <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-full backdrop-blur-sm border border-slate-700/50">
                                    <BarChart className="h-4 w-4 text-yellow-400" />
                                    <span>{course.level}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-full backdrop-blur-sm border border-slate-700/50">
                                <Globe className="h-4 w-4 text-blue-400" />
                                <span>English</span>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-full backdrop-blur-sm border border-slate-700/50">
                                <Clock className="h-4 w-4 text-emerald-400" />
                                <span>Last updated {new Date(course.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                                    {course.user.image ? (
                                        <Image src={course.user.image} alt={course.user.name || "Instructor"} width={40} height={40} />
                                    ) : (
                                        <User className="h-5 w-5" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white drop-shadow-sm">Created by <span className="text-primary hover:underline cursor-pointer font-bold">{course.user.name || "Instructor"}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10 -mt-12 md:-mt-20">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-10 mt-10 md:mt-20">

                    {/* What you'll learn */}
                    {/* We can parse this from description or if we add a dedicated field later */}
                    {/* For now, just show rich text or small description */}

                    {/* Course Content */}
                    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b bg-muted/30">
                            <h3 className="text-xl font-bold">Course Content</h3>
                            <p className="text-sm text-muted-foreground mt-1">{course.chapter.length} chapters</p>
                        </div>
                        <div>
                            {course.chapter.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">
                                    No chapters available yet.
                                </div>
                            ) : (
                                course.chapter.map((chapter) => (
                                    <div key={chapter.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {canAccess ? (
                                                <PlayCircle className="h-5 w-5 text-primary" />
                                            ) : (
                                                <Lock className="h-5 w-5 text-muted-foreground" />
                                            )}
                                            <span className="text-sm font-medium">{chapter.title}</span>
                                        </div>
                                        {canAccess && (
                                            <Button size="sm" variant="ghost" asChild>
                                                <Link href={`/courses/${course.slug}/chapters/${chapter.id}`}>
                                                    Watch
                                                </Link>
                                            </Button>
                                        )}
                                        {!canAccess && (
                                            <Badge variant="secondary">Encoded</Badge>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                        <h3 className="text-xl font-bold">Description</h3>
                        <CourseDescription description={course.description} />
                    </div>
                </div>

                {/* Sidebar Card */}
                <div className="relative">
                    <div className="sticky top-24 bg-card border rounded-xl shadow-lg overflow-hidden">
                        <div className="aspect-video relative bg-slate-900">
                            {course.fileKey ? (
                                <Image src={`https://utfs.io/f/${course.fileKey}`} alt={course.title} fill className="object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    <BookOpen className="h-12 w-12" />
                                </div>
                            )}
                            {/* Play Button Overlay if Preview Video Exists (Future) */}
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-foreground">
                                    {formatPriceSimple(course.price || 0, (session?.user as any)?.country)}
                                </span>
                                {course.price > 0 && (
                                    <span className="text-lg text-muted-foreground line-through mb-1">
                                        {formatPriceSimple(Math.round(course.price * 1.5), (session?.user as any)?.country)}
                                    </span>
                                )}
                            </div>

                            {canAccess ? (
                                <Button className="w-full text-lg h-12" asChild>
                                    <Link href={`/courses/${course.slug}/chapters/${course.chapter[0]?.id || ''}`}>
                                        Continue Learning
                                    </Link>
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <CoursePurchaseButton
                                        courseId={course.id}
                                        price={course.price!}
                                        country={(session?.user as any)?.country}
                                    />
                                    <p className="text-xs text-center text-muted-foreground">30-Day Money-Back Guarantee</p>
                                </div>
                            )}

                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-semibold text-sm">This course includes:</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <PlayCircle className="h-4 w-4" />
                                        {course.chapter.length} on-demand video lessons
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Full lifetime access
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4" />
                                        Access on mobile and TV
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Award className="h-4 w-4" />
                                        Certificate of completion
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper icon
import { Smartphone } from "lucide-react";

export const dynamic = "force-dynamic";
