import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const attemptResponseSchema = z.object({
  questionId: z.string(),
  answer: z.any(),
  timeSpent: z.number().min(0)
});

const createAttemptSchema = z.object({
  quizId: z.string(),
  responses: z.array(attemptResponseSchema)
});

const updateAttemptSchema = z.object({
  responses: z.array(attemptResponseSchema)
});

// GET /api/quiz/[id]/attempts - Get quiz attempts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { id } = await params;

    let whereClause: any = { quizId: id };

    const role = (session.user as any).role;
    let canSeeAll = role === 'admin';
    if (role === 'teacher') {
      const quiz = await prisma.quiz.findUnique({ where: { id }, select: { createdById: true } });
      canSeeAll = quiz?.createdById === session.user.id;
    }

    // Only the quiz owner (or an admin) sees other people's attempts.
    if (!canSeeAll) {
      whereClause.userId = session.user.id;
    } else if (userId) {
      whereClause.userId = userId;
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        responses: true,
        quiz: {
          select: {
            title: true,
            passingScore: true,
            maxAttempts: true,
            questions: {
              select: {
                id: true,
                points: true
              }
            }
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    return NextResponse.json(attempts);

  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/quiz/[id]/attempts - Start or submit quiz attempt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check if quiz is available
    if (!quiz.isPublished || !quiz.isActive) {
      return NextResponse.json({ error: "Quiz not available" }, { status: 403 });
    }

    // Check availability dates
    const now = new Date();
    if (quiz.availableFrom && now < quiz.availableFrom) {
      return NextResponse.json({ error: "Quiz not yet available" }, { status: 403 });
    }
    if (quiz.availableTo && now > quiz.availableTo) {
      return NextResponse.json({ error: "Quiz no longer available" }, { status: 403 });
    }

    // Check attempt limit
    if (quiz.maxAttempts > 0) {
      const existingAttempts = await prisma.quizAttempt.count({
        where: {
          quizId: id,
          userId: session.user.id,
          status: 'Submitted'
        }
      });

      if (existingAttempts >= quiz.maxAttempts) {
        return NextResponse.json({ error: "Maximum attempts exceeded" }, { status: 403 });
      }
    }

    const body = await request.json();

    // Check if this is just starting the quiz (no responses)
    if (!body.responses || body.responses.length === 0) {
      // Start new attempt
      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: id,
          userId: session.user.id,
          attemptNumber: 1, // Will be updated based on existing attempts
          startedAt: now,
          status: 'InProgress',
          timeSpent: 0,
          totalPoints: 0,
          maxPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
          passingScore: quiz.passingScore
        },
        include: {
          responses: true
        }
      });

      return NextResponse.json(attempt, { status: 201 });
    }

    // Submit attempt
    const validatedData = createAttemptSchema.parse(body);

    // Calculate scores
    const scoredResponses = await Promise.all(
      validatedData.responses.map(async (response) => {
        const question = quiz.questions.find(q => q.id === response.questionId);
        if (!question) {
          throw new Error(`Question not found: ${response.questionId}`);
        }

        const { isCorrect, pointsAwarded } = await gradeResponse(question, response.answer);

        return {
          questionId: response.questionId,
          answer: response.answer,
          isCorrect,
          pointsAwarded,
          timeTaken: response.timeSpent
        };
      })
    );

    const totalScore = scoredResponses.reduce((sum, r) => sum + r.pointsAwarded, 0);
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

    // Create or update attempt
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId: id,
        userId: session.user.id,
        status: 'InProgress'
      }
    });

    let attempt;
    if (existingAttempt) {
      // Update existing attempt
      attempt = await prisma.$transaction(async (tx) => {
        // Delete existing responses
        await tx.quizResponse.deleteMany({
          where: { attemptId: existingAttempt.id }
        });

        // Create new responses
        await tx.quizResponse.createMany({
          data: scoredResponses.map(r => ({
            attemptId: existingAttempt.id,
            questionId: r.questionId,
            answer: r.answer,
            isCorrect: r.isCorrect,
            pointsAwarded: r.pointsAwarded,
            timeTaken: r.timeTaken
          }))
        });

        // Update attempt
        return tx.quizAttempt.update({
          where: { id: existingAttempt.id },
          data: {
            submittedAt: now,
            totalPoints: totalScore,
            status: 'Submitted',
            timeSpent: Math.floor((now.getTime() - existingAttempt.startedAt.getTime()) / 1000)
          },
          include: {
            responses: true
          }
        });
      });
    } else {
      // Create new attempt
      attempt = await prisma.quizAttempt.create({
        data: {
          quizId: id,
          userId: session.user.id,
          attemptNumber: 1,
          startedAt: now,
          submittedAt: now,
          totalPoints: totalScore,
          maxPoints: totalPoints,
          passingScore: quiz.passingScore,
          status: 'Submitted',
          timeSpent: 0,
          responses: {
            create: scoredResponses.map(r => ({
              questionId: r.questionId,
              answer: r.answer,
              isCorrect: r.isCorrect,
              pointsAwarded: r.pointsAwarded,
              timeTaken: r.timeTaken
            }))
          }
        },
        include: {
          responses: true
        }
      });
    }

    return NextResponse.json(attempt, { status: 201 });

  } catch (error) {
    console.error('Error creating quiz attempt:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to grade responses
async function gradeResponse(question: any, answer: any): Promise<{ isCorrect: boolean; pointsAwarded: number }> {
  if (answer === null || answer === undefined || answer === '') {
    return { isCorrect: false, pointsAwarded: 0 };
  }

  switch (question.type) {
    case 'MultipleChoice':
      const options = question.questionData?.options || [];
      const correctOptions = options.filter((opt: any) => opt.isCorrect);

      if (Array.isArray(answer)) {
        // Multiple correct answers
        const correctAnswers = correctOptions.map((opt: any) => opt.id);
        const isMultipleChoiceCorrect = answer.length === correctAnswers.length &&
          answer.every((a: string) => correctAnswers.includes(a));

        if (question.partialCredit && !isMultipleChoiceCorrect) {
          const correctCount = answer.filter((a: string) => correctAnswers.includes(a)).length;
          const incorrectCount = answer.filter((a: string) => !correctAnswers.includes(a)).length;
          const partialScore = Math.max(0, (correctCount - incorrectCount) / correctAnswers.length);
          return { isCorrect: false, pointsAwarded: Math.round(question.points * partialScore) };
        }

        return { isCorrect: isMultipleChoiceCorrect, pointsAwarded: isMultipleChoiceCorrect ? question.points : 0 };
      } else {
        // Single answer
        const isSingleChoiceCorrect = correctOptions.some((opt: any) => opt.id === answer);
        return { isCorrect: isSingleChoiceCorrect, pointsAwarded: isSingleChoiceCorrect ? question.points : 0 };
      }

    case 'TrueFalse':
      const correctAnswer = question.questionData?.correctAnswer;
      const isTrueFalseCorrect = (answer === 'true') === correctAnswer;
      return { isCorrect: isTrueFalseCorrect, pointsAwarded: isTrueFalseCorrect ? question.points : 0 };

    case 'ShortAnswer':
      const correctAnswers = question.questionData?.correctAnswers || [];
      const caseSensitive = question.questionData?.caseSensitive || false;

      const studentAnswer = caseSensitive ? answer : answer.toLowerCase();
      const isShortAnswerCorrect = correctAnswers.some((correct: string) => {
        const correctAnswer = caseSensitive ? correct : correct.toLowerCase();
        return studentAnswer === correctAnswer;
      });

      return { isCorrect: isShortAnswerCorrect, pointsAwarded: isShortAnswerCorrect ? question.points : 0 };

    case 'LongAnswer':
      // Long answers require manual grading
      return { isCorrect: false, pointsAwarded: 0 };

    case 'FillInTheBlank':
      const blanks = question.questionData?.blanks || [];
      let correctCount = 0;

      blanks.forEach((blank: any, index: number) => {
        const studentAnswer = answer[index];
        if (studentAnswer) {
          const caseSensitive = blank.caseSensitive || false;
          const studentText = caseSensitive ? studentAnswer : studentAnswer.toLowerCase();

          const isBlankCorrect = blank.correctAnswers.some((correct: string) => {
            const correctText = caseSensitive ? correct : correct.toLowerCase();
            return studentText === correctText;
          });

          if (isBlankCorrect) correctCount++;
        }
      });

      const isFillInBlankCorrect = correctCount === blanks.length;

      if (question.partialCredit && !isFillInBlankCorrect) {
        const partialScore = correctCount / blanks.length;
        return { isCorrect: false, pointsAwarded: Math.round(question.points * partialScore) };
      }

      return { isCorrect: isFillInBlankCorrect, pointsAwarded: isFillInBlankCorrect ? question.points : 0 };

    default:
      return { isCorrect: false, pointsAwarded: 0 };
  }
}