import { requireTeacher } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    BookOpen,
    GraduationCap,
    Target,
    Clock,
    Calendar,
    ChevronLeft,
    Mail,
    Award
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { getStudentPerformanceMetrics, generateStudentCSVReport } from "@/lib/teacher/analytics-service";
import { CheckCircle2, UserX, BarChart3, Download, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: PageProps) {
    const { id: studentId } = await params;
    const session = await requireTeacher();
    const teacherId = session.user.id;

    // Fetch student data
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
            preferences: true,
            enrollment: {
                where: {
                    Course: {
                        userId: teacherId
                    }
                },
                include: {
                    Course: {
                        include: {
                            chapter: {
                                include: {
                                    lessons: true
                                }
                            }
                        }
                    }
                }
            },
            lessonProgress: true
        }
    });

    if (!student) {
        return notFound();
    }

    const performance = await getStudentPerformanceMetrics(studentId, teacherId);

    // Process course progress
    const coursesProgress = student.enrollment.map(enrollment => {
        const course = enrollment.Course;
        const totalLessons = course.chapter.reduce((acc, chap) => acc + chap.lessons.length, 0);

        const courseLessonIds = course.chapter.flatMap(c => c.lessons.map(l => l.id));
        const completedLessons = student.lessonProgress.filter(
            p => p.completed && courseLessonIds.includes(p.lessonId)
        ).length;

        const percentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        return {
            id: course.id,
            title: course.title,
            percentage,
            completedLessons,
            totalLessons
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/teacher/students">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Student Profile</h1>
                        <p className="text-muted-foreground text-sm">Viewing details for {student.name}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Report
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                {/* ... existing card ... */}
                {/* Profile Card */}
                <Card className="md:col-span-1 border-none shadow-md">
                    <CardContent className="pt-6 text-center">
                        <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-slate-100">
                            <AvatarImage src={student.image || ""} />
                            <AvatarFallback className="text-2xl">{student.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold">{student.name}</h2>
                        <p className="text-muted-foreground text-sm flex items-center justify-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                        </p>

                        <div className="mt-6 space-y-3">
                            <div className="flex justify-between text-sm py-2 border-y">
                                <span className="text-muted-foreground">Joined</span>
                                <span className="font-medium">{new Date(student.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2">
                                <span className="text-muted-foreground">Courses</span>
                                <span className="font-medium">{coursesProgress.length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Performance Insights */}
                    <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                <BarChart3 className="h-5 w-5" />
                                Performance Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-blue-100 dark:border-slate-700">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Attendance</p>
                                    <p className="text-2xl font-bold text-blue-600">{performance.attendance.rate.toFixed(1)}%</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-blue-100 dark:border-slate-700">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Avg Quiz</p>
                                    <p className="text-2xl font-bold text-indigo-600">{performance.quizzes.averageScore.toFixed(1)}%</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-blue-100 dark:border-slate-700">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Sessions</p>
                                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{performance.attendance.completed}</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-blue-100 dark:border-slate-700">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">No-Shows</p>
                                    <p className="text-2xl font-bold text-red-500">{performance.attendance.noShow}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* About & Education */}
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-blue-600" />
                                Background & Education
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Biography</h4>
                                <p className="text-slate-700 dark:text-slate-300">
                                    {student.bio || "No biography provided."}
                                </p>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Education</h4>
                                <p className="text-slate-700 dark:text-slate-300">
                                    {student.education || "No education details provided."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Goals & Interests */}
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5 text-red-600" />
                                Learning Goals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Interests</h4>
                                <div className="flex flex-wrap gap-2">
                                    {student.preferences?.categories?.length ? (
                                        student.preferences.categories.map((cat, i) => (
                                            <Badge key={i} variant="secondary" className="bg-slate-100 hover:bg-slate-200 border-none px-3">
                                                {cat}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No interests selected</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Current Goals</h4>
                                <div className="space-y-2">
                                    {student.preferences?.goals?.length ? (
                                        student.preferences.goals.map((goal, i) => (
                                            <div key={i} className="flex gap-3 text-sm items-start">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                                <span>{goal}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No specific goals stated</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress in Your Courses */}
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-indigo-600" />
                                Progress in My Courses
                            </CardTitle>
                            <CardDescription>How {student.name} is performing in your classes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {coursesProgress.length > 0 ? (
                                coursesProgress.map((course) => (
                                    <div key={course.id} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <h4 className="font-semibold text-sm">{course.title}</h4>
                                            <span className="text-xs font-medium text-slate-500">
                                                {course.completedLessons}/{course.totalLessons} Lessons
                                            </span>
                                        </div>
                                        <div className="relative pt-1">
                                            <Progress value={course.percentage} className="h-2" />
                                            <span className="absolute right-0 top-0 -mt-5 text-[10px] font-bold text-blue-600">
                                                {Math.round(course.percentage)}%
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-4 text-muted-foreground italic">
                                    This student is not currently enrolled in any of your courses.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
