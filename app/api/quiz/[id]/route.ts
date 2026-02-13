import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateQuizSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  lessonId: z.string().optional(),
  timeLimit: z.number().optional(),
  passingScore: z.number().min(0).max(100).optional(),
  maxAttempts: z.number().min(-1).optional(),
  showResults: z.boolean().optional(),
  showCorrectAnswers: z.boolean().optional(),
  randomizeQuestions: z.boolean().optional(),
  randomizeOptions: z.boolean().optional(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  isPublished: z.boolean().optional(),
  isActive: z.boolean().optional(),
  questions: z.array(z.object({
    id: z.string().optional(),
    type: z.enum(['MultipleChoice', 'TrueFalse', 'ShortAnswer', 'LongAnswer', 'FillInTheBlank', 'Matching', 'Ordering']),
    question: z.string().min(1),
    explanation: z.string().optional(),
    points: z.number().min(0),
    difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Expert']),
    position: z.number(),
    questionData: z.any(),
    isRequired: z.boolean(),
    partialCredit: z.boolean()
  })).optional()
});

// GET /api/quiz/[id] - Get specific quiz
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { position: 'asc' }
        },
        course: {
          select: { title: true, id: true }
        },
        chapter: {
          select: { title: true, id: true }
        },
        lesson: {
          select: { title: true, id: true }
        },
        createdBy: {
          select: { name: true, email: true }
        },
        attempts: (session.user as any).role === 'teacher' || (session.user as any).role === 'admin' ? {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        } : {
          where: { userId: session.user.id },
          include: {
            responses: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Students can only access published and active quizzes
    if ((session.user as any).role === 'student') {
      if (!quiz.isPublished || !quiz.isActive) {
        return NextResponse.json({ error: "Quiz not available" }, { status: 403 });
      }

      // CRITICAL SECURITY FIX: Enrollment Check (Author: Sanket)
      if (quiz.courseId) {
          const enrollment = await prisma.enrollment.findUnique({
              where: {
                  userId_courseId: {
                      userId: session.user.id,
                      courseId: quiz.courseId
                  }
              }
          });
          if (!enrollment) {
              return NextResponse.json({ error: "Forbidden: You must be enrolled in the course to access this quiz" }, { status: 403 });
          }
      }

      // Check availability dates
      const now = new Date();
      if (quiz.availableFrom && now < quiz.availableFrom) {
        return NextResponse.json({ error: "Quiz not yet available" }, { status: 403 });
      }
      if (quiz.availableTo && now > quiz.availableTo) {
        return NextResponse.json({ error: "Quiz no longer available" }, { status: 403 });
      }
    }

    // Sanitize questions for students - Author: Sanket
    if ((session.user as any).role === 'student') {
        quiz.questions = quiz.questions.map((q: any) => {
            const { explanation, ...rest } = q;
            let sanitizedData = { ...q.questionData };

            // Strip correct answers/indicators from questionData
            if (sanitizedData.options) {
                sanitizedData.options = sanitizedData.options.map((opt: any) => {
                    const { isCorrect, ...optRest } = opt;
                    return optRest;
                });
            }
            if (sanitizedData.correctAnswer) delete sanitizedData.correctAnswer;
            if (sanitizedData.correctAnswers) delete sanitizedData.correctAnswers;
            if (sanitizedData.pairs) {
                // For Matching, don't leak the pairs
                delete sanitizedData.pairs;
            }

            return { ...rest, questionData: sanitizedData };
        });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/quiz/[id] - Update quiz
export async function PUT(
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

    // Only teachers and admins can update quizzes
    if ((session.user as any).role !== 'teacher' && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id }
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check if user owns the quiz or is admin
    if (quiz.createdById !== session.user.id && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateQuizSchema.parse(body);

    // CRITICAL SECURITY FIX: Teacher Ownership Check (Author: Sanket)
    if ((session.user as any).role === 'teacher') {
        if (validatedData.courseId) {
            const course = await prisma.course.findFirst({
                where: { id: validatedData.courseId, userId: session.user.id }
            });
            if (!course) return NextResponse.json({ error: "Forbidden: You don't own this course" }, { status: 403 });
        }
        
        if (validatedData.chapterId) {
            const chapter = await prisma.chapter.findFirst({
                where: { id: validatedData.chapterId, Course: { userId: session.user.id } }
            });
            if (!chapter) return NextResponse.json({ error: "Forbidden: You don't own this chapter" }, { status: 403 });
        }

        if (validatedData.lessonId) {
            const lesson = await prisma.lesson.findFirst({
                where: { id: validatedData.lessonId, Chapter: { Course: { userId: session.user.id } } }
            });
            if (!lesson) return NextResponse.json({ error: "Forbidden: You don't own this lesson" }, { status: 403 });
        }
    }

    // Handle questions update separately
    const { questions, ...quizData } = validatedData;

    const updatedQuiz = await prisma.$transaction(async (tx) => {
      // Update quiz data
      const quiz = await tx.quiz.update({
        where: { id },
        data: {
          ...quizData,
          availableFrom: validatedData.availableFrom ? new Date(validatedData.availableFrom) : undefined,
          availableTo: validatedData.availableTo ? new Date(validatedData.availableTo) : undefined,
        }
      });

      // Update questions if provided
      if (questions) {
        // Delete existing questions
        await tx.quizQuestion.deleteMany({
          where: { quizId: id }
        });

        // Create new questions
        await tx.quizQuestion.createMany({
          data: questions.map(q => ({
            quizId: id,
            type: q.type,
            question: q.question,
            explanation: q.explanation,
            points: q.points,
            difficulty: q.difficulty,
            position: q.position,
            questionData: q.questionData,
            isRequired: q.isRequired,
            partialCredit: q.partialCredit
          }))
        });
      }

      // Return updated quiz with questions
      return tx.quiz.findUnique({
        where: { id },
        include: {
          questions: {
            orderBy: { position: 'asc' }
          }
        }
      });
    });

    return NextResponse.json(updatedQuiz);

  } catch (error) {
    console.error('Error updating quiz:', error);

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

// DELETE /api/quiz/[id] - Delete quiz
export async function DELETE(
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

    // Only teachers and admins can delete quizzes
    if ((session.user as any).role !== 'teacher' && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attempts: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check if user owns the quiz or is admin
    if (quiz.createdById !== session.user.id && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent deletion if there are attempts
    if (quiz._count.attempts > 0) {
      return NextResponse.json(
        { error: "Cannot delete quiz with existing attempts" },
        { status: 400 }
      );
    }

    await prisma.quiz.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Quiz deleted successfully" });

  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}