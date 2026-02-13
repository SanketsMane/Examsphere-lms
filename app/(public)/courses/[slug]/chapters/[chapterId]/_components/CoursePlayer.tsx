"use client";

import { useEffect, useState } from "react";
import { CourseSidebar } from "./CourseSidebar";
import { VideoPlayer } from "./VideoPlayer";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, ArrowLeft, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { updateLessonProgress } from "@/app/actions/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import DOMPurify from "isomorphic-dompurify";

interface CoursePlayerProps {
    course: any; // Using permissive types for simpler integration
    chapterId: string;
    lessonId: string;
    lesson: any; // The active lesson data
    nextLessonId?: string;
    prevLessonId?: string;
}

export function CoursePlayer({
    course,
    chapterId,
    lessonId,
    lesson,
    nextLessonId,
    prevLessonId
}: CoursePlayerProps) {
    const router = useRouter();
    const { width, height } = useWindowSize();
    const [isCompleted, setIsCompleted] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Sync completion status from server data on load/change
    useEffect(() => {
        setIsCompleted(lesson?.lessonProgress?.[0]?.completed || false);
    }, [lesson]);

    const onLessonComplete = async () => {
        // Optimistic update
        const wasCompleted = isCompleted;
        setIsCompleted(true);

        if (!wasCompleted) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);

            // Update progress in background (don't wait)
            updateLessonProgress(lessonId, true).catch((error) => {
                console.error("Failed to update progress", error);
            });
        }

        // Navigate immediately if there's a next lesson
        if (nextLessonId) {
            // Find chapter for next lesson
            const nextChapter = course.chapter.find((c: any) => c.lessons.some((l: any) => l.id === nextLessonId));
            if (nextChapter) {
                router.push(`/courses/${course.slug}/chapters/${nextChapter.id}?lessonId=${nextLessonId}`);
            }
        }
    };

    const navigateToLesson = (lid: string) => {
        const targetChapter = course.chapter.find((c: any) => c.lessons.some((l: any) => l.id === lid));
        if (targetChapter) {
            router.push(`/courses/${course.slug}/chapters/${targetChapter.id}?lessonId=${lid}`);
        }
    }

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#020817] overflow-hidden">
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

            {/* Desktop Sidebar */}
            <div className="hidden lg:flex w-80 flex-col border-r bg-background h-full z-20">
                <CourseSidebar course={course} activeLessonId={lesson?.id} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto">
                {/* Mobile Header */}
                <div className="lg:hidden p-4 border-b bg-background flex items-center justify-between sticky top-0 z-50">
                    <div className="font-semibold truncate max-w-[200px]">
                        {course.title}
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-80">
                            <CourseSidebar course={course} activeLessonId={lesson?.id} />
                        </SheetContent>
                    </Sheet>
                </div>

                <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
                    {/* Video Section */}
                    <div className="space-y-6">
                        <VideoPlayer
                            title={lesson?.title}
                            videoKey={lesson?.videoKey}
                            videoUrl={lesson?.videoUrl} // Provide fallback if schema uses videoUrl
                            onEnded={onLessonComplete}
                        />

                        {/* Title & Actions */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold">{lesson?.title}</h1>
                                <p className="text-muted-foreground mt-1 text-sm">{course.title} &bull; Chapter {course.chapter.findIndex((c: any) => c.id === chapterId) + 1}</p>
                            </div>

                            <Button
                                onClick={onLessonComplete}
                                size="lg"
                                className={cn(
                                    "gap-2 transition-all",
                                    isCompleted ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary"
                                )}
                            >
                                {isCompleted ? (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        Completed
                                    </>
                                ) : (
                                    <>
                                        Mark as Complete
                                        <ArrowRight className="h-5 w-5 ml-1" />
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Description */}
                        {lesson?.description && (
                            <div className="prose dark:prose-invert max-w-none mt-8 p-6 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-semibold mb-2">About this lesson</h3>
                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.description) }} />
                            </div>
                        )}

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                            <Button
                                variant="outline"
                                disabled={!prevLessonId}
                                onClick={() => prevLessonId && navigateToLesson(prevLessonId)}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Previous Lesson
                            </Button>

                            <Button
                                disabled={!nextLessonId}
                                onClick={() => nextLessonId && navigateToLesson(nextLessonId)}
                                className="gap-2"
                            >
                                Next Lesson
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

