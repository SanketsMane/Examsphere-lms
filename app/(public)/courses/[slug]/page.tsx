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
    BarChart,
    CheckCircle2,
    PlayCircle,
    Lock,
} from "lucide-react";
import type { Metadata } from "next";
import { withSocial } from "@/lib/seo-metadata";
import { CoursePurchaseButton } from "./_components/CoursePurchaseButton";
import { EnquireButton } from "@/components/marketing/examsphere/EnquireButton";

import { CourseDescription } from "./_components/CourseDescription";
import { constructS3Url } from "@/lib/s3-helper";
import { JsonLd, ORG_ID, SITE_URL, breadcrumbList } from "@/components/seo/JsonLd";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const course = await prisma.course.findUnique({
        where: { slug },
        select: { title: true, smallDescription: true, status: true },
    });

    if (!course || course.status !== "Published") {
        return { title: "Course not found | ExamSphere" };
    }

    return withSocial({
        title: `${course.title} | ExamSphere`,
        description: course.smallDescription,
        alternates: { canonical: `/courses/${slug}` },
    });
}

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
            },
        },
    });

    if (!course) {
        notFound();
    }

    const isOwner = !!session && session.user.id === course.userId;
    const isAdmin = (session?.user as any)?.role === "admin";

    // Drafts and courses awaiting review must not be reachable by slug for the public.
    if (course.status !== "Published" && !isOwner && !isAdmin) {
        notFound();
    }

    // Only an active (paid) enrollment counts. Without a session there is nothing to look up —
    // `userId: undefined` would match every enrollment and show "Continue Learning" to visitors.
    const activeEnrollment = session
        ? await prisma.enrollment.findFirst({
              where: { courseId: course.id, userId: session.user.id, status: "Active" },
              select: { id: true },
          })
        : null;

    const canAccess = !!activeEnrollment || isOwner || isAdmin;
    const lessonCount = course.chapter.reduce((total, chapter) => total + chapter.lessons.length, 0);

    // Mirrors what the page shows: title, summary and language. No offers/price — fees aren't published.
    const courseSchema = {
        "@context": "https://schema.org",
        "@type": "Course",
        name: course.title,
        description: course.smallDescription || course.title,
        url: `${SITE_URL}/courses/${course.slug}`,
        provider: { "@id": ORG_ID },
        inLanguage: course.language || "English",
        ...(course.fileKey ? { image: constructS3Url(course.fileKey) } : {}),
        hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online" },
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <JsonLd
                data={[
                    courseSchema,
                    breadcrumbList([
                        { name: "Home", path: "/" },
                        { name: "Courses", path: "/courses" },
                        { name: course.title, path: `/courses/${course.slug}` },
                    ]),
                ]}
            />
            {/* Hero Section */}
            <div className="relative bg-slate-900 text-white pt-12 pb-24 md:pt-16 md:pb-32 overflow-hidden">
                {/* Background Banner */}
                {course.fileKey && (
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={constructS3Url(course.fileKey)}
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
                                <span>{course.language || "English"}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-full backdrop-blur-sm border border-slate-700/50">
                                <Clock className="h-4 w-4 text-emerald-400" />
                                <span>Last updated {new Date(course.updatedAt).toLocaleDateString("en-IN")}</span>
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
                            <h2 className="text-xl font-bold">Course Content</h2>
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
                                            <Badge variant="secondary">Locked</Badge>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                        <h2 className="text-xl font-bold">Description</h2>
                        <CourseDescription description={course.description} />
                    </div>
                </div>

                {/* Sidebar Card */}
                <div className="relative">
                    <div className="sticky top-24 bg-card border rounded-xl shadow-lg overflow-hidden">
                        <div className="aspect-video relative bg-slate-900">
                            {course.fileKey ? (
                                <Image src={constructS3Url(course.fileKey)} alt={course.title} fill className="object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    <BookOpen className="h-12 w-12" />
                                </div>
                            )}
                            {/* Play Button Overlay if Preview Video Exists (Future) */}
                        </div>
                        <div className="p-6 space-y-6">
                            {canAccess ? (
                                <Button className="w-full text-lg h-12" asChild>
                                    <Link href={`/courses/${course.slug}/chapters/${course.chapter[0]?.id || ''}`}>
                                        Continue Learning
                                    </Link>
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    {course.price > 0 ? (
                                        // Fees aren't published, so paid courses enrol through the admissions
                                        // team rather than a checkout that would charge an unseen amount.
                                        <>
                                            <EnquireButton
                                                label="Enroll Now"
                                                className="w-full inline-flex items-center justify-center h-12 rounded-md bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90 transition-colors"
                                            />
                                            <p className="text-xs text-center text-muted-foreground">
                                                Our admissions team will share the fee and batch details.
                                            </p>
                                        </>
                                    ) : (
                                        <CoursePurchaseButton
                                            courseId={course.id}
                                            price={course.price!}
                                            country={(session?.user as any)?.country}
                                        />
                                    )}
                                    <p className="text-xs text-center text-muted-foreground">
                                        Refunds as per our{" "}
                                        <Link href="/refund" className="underline hover:text-primary">
                                            refund policy
                                        </Link>
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-semibold text-sm">This course includes:</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        {course.chapter.length} {course.chapter.length === 1 ? "chapter" : "chapters"}
                                    </li>
                                    {lessonCount > 0 && (
                                        <li className="flex items-center gap-2">
                                            <PlayCircle className="h-4 w-4" />
                                            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const dynamic = "force-dynamic";
