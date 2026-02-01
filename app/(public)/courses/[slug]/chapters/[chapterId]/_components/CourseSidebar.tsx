"use client";

import { Chapter, Course, Lesson, LessonProgress } from "@prisma/client";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { CheckCircle, Lock, PlayCircle, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

// Define simpler types to avoid deeply nested Prisma type issues in props
interface SidebarLesson {
    id: string;
    title: string;
    position: true;
    lessonProgress: { completed: boolean; lessonId: string }[];
}

interface SidebarChapter {
    id: string;
    title: string;
    lessons: any[];
    quizzes: any[]; // Added quizzes prop
}

interface CourseSidebarProps {
    course: Course & { chapter: any[] };
    activeLessonId?: string;
}

export function CourseSidebar({ course, activeLessonId }: CourseSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const onLessonClick = (lessonId: string) => {
        const chapter = course.chapter.find(c => c.lessons.some((l: any) => l.id === lessonId));
        if (chapter) {
            router.push(`/courses/${course.slug}/chapters/${chapter.id}?lessonId=${lessonId}`);
        }
    };

    const onQuizClick = (quizId: string) => {
        router.push(`/courses/${course.slug}/quiz/${quizId}`);
    };

    return (
        <div className="h-full border-r flex flex-col overflow-y-auto bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="font-bold text-lg mb-2 truncate" title={course.title}>
                    {course.title}
                </h2>
            </div>

            <div className="flex-1">
                <Accordion
                    type="multiple"
                    defaultValue={course.chapter.map(c => c.id)}
                    className="w-full"
                >
                    {course.chapter.map((chapter) => (
                        <AccordionItem key={chapter.id} value={chapter.id} className="border-b last:border-0">
                            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                <span className="font-semibold text-sm text-left">{chapter.title}</span>
                            </AccordionTrigger>
                            <AccordionContent className="pt-0 pb-0">
                                <div className="flex flex-col w-full">
                                    {/* Lessons */}
                                    {chapter.lessons.map((lesson: any) => {
                                        const isActive = activeLessonId === lesson.id;
                                        const isCompleted = lesson.lessonProgress?.[0]?.completed;

                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => onLessonClick(lesson.id)}
                                                className={cn(
                                                    "flex items-center gap-x-3 px-6 py-3.5 text-sm font-[500] hover:text-slate-600 dark:hover:text-slate-300 transition-all text-left w-full border-l-[4px]",
                                                    isActive
                                                        ? "text-slate-700 dark:text-slate-100 bg-blue-50/50 dark:bg-blue-900/20 border-blue-600"
                                                        : "text-slate-500 border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50",
                                                    isCompleted && "text-emerald-700 dark:text-emerald-400"
                                                )}
                                            >
                                                <div className="flex-shrink-0">
                                                    {isCompleted ? (
                                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                                    ) : isActive ? (
                                                        <PlayCircle className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-slate-500")} />
                                                    ) : (
                                                        <Radio className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </div>
                                                <span className={cn("line-clamp-1", isCompleted && "line-through opacity-60")}>
                                                    {lesson.title}
                                                </span>
                                            </button>
                                        );
                                    })}

                                    {/* Quizzes */}
                                    {chapter.quizzes && chapter.quizzes.map((quiz: any) => {
                                        const isQuizActive = pathname?.includes(`/quiz/${quiz.id}`);
                                        const isPassed = quiz.attempts?.[0]?.passed || false;
                                        const attemptStatus = quiz.attempts?.[0]?.status;

                                        return (
                                            <button
                                                key={quiz.id}
                                                onClick={() => onQuizClick(quiz.id)}
                                                className={cn(
                                                    "flex items-center gap-x-3 px-6 py-3.5 text-sm font-[500] hover:text-slate-600 dark:hover:text-slate-300 transition-all text-left w-full border-l-[4px]",
                                                    isQuizActive
                                                        ? "text-slate-700 dark:text-slate-100 bg-purple-50/50 dark:bg-purple-900/20 border-purple-600"
                                                        : "text-slate-500 border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50",
                                                    isPassed && "text-emerald-700 dark:text-emerald-400"
                                                )}
                                            >
                                                <div className="flex-shrink-0">
                                                    {isPassed ? (
                                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                                    ) : attemptStatus === "InProgress" ? (
                                                        <Radio className="h-4 w-4 text-orange-500 animate-pulse" />
                                                    ) : (
                                                        <HelpCircle className={cn("h-4 w-4", isQuizActive ? "text-purple-600" : "text-slate-400")} />
                                                    )}
                                                </div>
                                                <span className={cn("line-clamp-1", isPassed && "line-through opacity-60")}>
                                                    Quiz: {quiz.title}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}

import { HelpCircle } from "lucide-react";
