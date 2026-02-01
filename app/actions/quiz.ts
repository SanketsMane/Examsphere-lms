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

        // 2. Calculate Score
        let totalPoints = 0;
        let earnedPoints = 0;
        const responseData = [];

        for (const question of quiz.questions) {
            totalPoints += question.points;

            const userAnswer = responses[question.id];
            let isCorrect = false;
            let pointsAwarded = 0;

            if (userAnswer !== undefined) {
                // Grading Logic (Simplified for MVP)
                // TODO: Expand logic for other types like Matching/Ordering

                if (question.type === 'MultipleChoice') {
                    const options = (question.questionData as any).options || [];
                    const correctOption = options.find((opt: any) => opt.isCorrect);
                    if (correctOption && correctOption.id === userAnswer) {
                        isCorrect = true;
                    }
                } else if (question.type === 'TrueFalse') {
                    const correctAnswer = (question.questionData as any).correctAnswer;
                    if (correctAnswer === userAnswer) {
                        isCorrect = true;
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
                    }
                }

                if (isCorrect) {
                    pointsAwarded = question.points;
                    earnedPoints += pointsAwarded;
                }
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

        const attempt = await prisma.quizAttempt.create({
            data: {
                quizId: quizId,
                userId: userId,
                attemptNumber: attemptCount + 1,
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

        revalidatePath(`/courses/${quiz.courseId}`);
        return { success: true, attemptId: attempt.id, passed, percentage };

    } catch (error) {
        console.error("Error submitting quiz:", error);
        throw new Error("Failed to submit quiz");
    }
}
