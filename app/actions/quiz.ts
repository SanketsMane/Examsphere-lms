"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";

export async function submitQuizAttempt(payload: {
    quizId: string;
    attemptId?: string;
    responses: Record<string, any>;
}) {
    try {
        const session = await getSessionWithRole();
        if (!session?.user?.id) {
            throw new Error("Unauthorized");
        }

        const userId = session.user.id;
        const { quizId, responses } = payload;

        // 1. Fetch Quiz with correct answers
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: true
            }
        });

        if (!quiz) {
            throw new Error("Quiz not found");
        }

        // CRITICAL FIX: Validate quiz is published and active
        if (!quiz.isPublished || !quiz.isActive) {
            throw new Error("This quiz is not available for submission.");
        }

        // CRITICAL SECURITY FIX: Verify Enrollment (Author: Sanket)
        if (quiz.courseId) {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: userId,
                        courseId: quiz.courseId
                    }
                }
            });
            if (!enrollment) throw new Error("You must be enrolled in the course to take this quiz.");
        }

        // CRITICAL FIX: Check attempt count and enforce limits
        const attemptCount = await prisma.quizAttempt.count({
            where: {
                quizId: quizId,
                userId: userId
            }
        });

        if (quiz.maxAttempts && attemptCount >= quiz.maxAttempts) {
            throw new Error(`Maximum attempts (${quiz.maxAttempts}) reached for this quiz.`);
        }

        // QA-080: Rate Limiting (Author: Sanket)
        const lastAttempt = await prisma.quizAttempt.findFirst({
            where: { quizId, userId },
            orderBy: { submittedAt: "desc" }
        });

        if (lastAttempt && lastAttempt.submittedAt) {
            const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
            if (lastAttempt.submittedAt > sixtySecondsAgo) {
                throw new Error("You are submitting attempts too quickly. Please wait a minute.");
            }
        }

        // 2. Calculate Score
        let totalPoints = 0;
        let earnedPoints = 0;
        const responseData: any[] = [];

        for (const question of quiz.questions) {
            totalPoints += question.points;

            const userAnswer = responses[question.id];
            let isCorrect = false;
            let pointsAwarded = 0;

            if (userAnswer !== undefined) {
                // Grading Logic (Simplified for MVP)
                // Grading Logic (Simplified for MVP)

                if (question.type === 'MultipleChoice') {
                    const options = (question.questionData as any).options || [];
                    const correctOption = options.find((opt: any) => opt.isCorrect);
                    if (correctOption && correctOption.id === userAnswer) {
                        isCorrect = true;
                        pointsAwarded = question.points;
                    }
                } else if (question.type === 'TrueFalse') {
                    const correctAnswer = (question.questionData as any).correctAnswer;
                    if (correctAnswer === userAnswer) {
                        isCorrect = true;
                        pointsAwarded = question.points;
                    }
                } else if (question.type === 'ShortAnswer') {
                    const correctAnswers = (question.questionData as any).correctAnswers || [];
                    const isCaseSensitive = (question.questionData as any).caseSensitive;

                    if (correctAnswers.some((ans: string) =>
                        isCaseSensitive
                            ? ans === userAnswer
                            : ans.toLowerCase() === (userAnswer as string).toLowerCase()
                    )) {
                        isCorrect = true;
                        pointsAwarded = question.points;
                    }
                } else if (question.type === 'Matching') {
                    const pairs = (question.questionData as any).pairs || [];
                    const userPairs = userAnswer || {};
                    let matches = 0;
                    pairs.forEach((pair: any) => {
                        if (userPairs[pair.left] === pair.right) {
                            matches++;
                        }
                    });
                    
                    if (pairs.length > 0) {
                        if (matches === pairs.length) {
                            isCorrect = true;
                            pointsAwarded = question.points;
                        } else if (question.partialCredit && matches > 0) {
                            pointsAwarded = Math.round((matches / pairs.length) * question.points);
                        }
                    }
                } else if (question.type === 'Ordering') {
                    const correctOrder = (question.questionData as any).items || [];
                    if (Array.isArray(userAnswer) && userAnswer.length === correctOrder.length) {
                        const correctCount = userAnswer.filter((val, index) => val === correctOrder[index]).length;
                        if (correctCount === correctOrder.length) {
                            isCorrect = true;
                            pointsAwarded = question.points;
                        } else if (question.partialCredit && correctCount > 0) {
                            pointsAwarded = Math.round((correctCount / correctOrder.length) * question.points);
                        }
                    }
                }

                earnedPoints += pointsAwarded;
            }

            responseData.push({
                questionId: question.id,
                answer: userAnswer,
                isCorrect,
                pointsAwarded
            });
        }

        const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
        const passed = percentage >= quiz.passingScore;

        // 3. Create Quiz Attempt Record
        // We use upsert if attemptId is provided (though usually it's a new create on submit)
        // For simple flow, just create a new attempt on submit

        // Attempt count already checked above for validation

        // 3. Create Quiz Attempt Record (Atomic)
        const attempt = await prisma.$transaction(async (tx) => {
            // Re-verify attempt count inside transaction to prevent race conditions
            const txAttemptCount = await tx.quizAttempt.count({
                where: {
                    quizId: quizId,
                    userId: userId
                }
            });

            if (quiz.maxAttempts && txAttemptCount >= quiz.maxAttempts) {
                throw new Error(`Maximum attempts (${quiz.maxAttempts}) reached for this quiz.`);
            }

            return await tx.quizAttempt.create({
                data: {
                    quizId: quizId,
                    userId: userId,
                    attemptNumber: txAttemptCount + 1,
                    status: 'Completed',
                    totalPoints: earnedPoints,
                    maxPoints: totalPoints,
                    percentage: percentage,
                    passed: passed,
                    submittedAt: new Date(),
                    passingScore: quiz.passingScore,
                    responses: {
                        create: responseData.map(r => ({
                            questionId: r.questionId,
                            answer: r.answer,
                            isCorrect: r.isCorrect,
                            pointsAwarded: r.pointsAwarded
                        }))
                    }
                }
            });
        });

        revalidatePath(`/courses/${quiz.courseId}`);
        return { success: true, attemptId: attempt.id, passed, percentage };

    } catch (error) {
        console.error("Error submitting quiz:", error);
        throw new Error("Failed to submit quiz");
    }
}
