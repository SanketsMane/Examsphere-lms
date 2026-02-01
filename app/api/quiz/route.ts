import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  lessonId: z.string().optional(),
  timeLimit: z.number().optional(),
  passingScore: z.number().min(0).max(100),
  maxAttempts: z.number().min(-1),
  showResults: z.boolean(),
  showCorrectAnswers: z.boolean(),
  randomizeQuestions: z.boolean(),
  randomizeOptions: z.boolean(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  isPublished: z.boolean(),
  isActive: z.boolean(),
  questions: z.array(z.object({
    type: z.enum(['MultipleChoice', 'TrueFalse', 'ShortAnswer', 'LongAnswer', 'FillInTheBlank', 'Matching', 'Ordering']),
    question: z.string().min(1),
    explanation: z.string().optional(),
    points: z.number().min(0),
    difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Expert']),
    position: z.number(),
    questionData: z.any(),
    isRequired: z.boolean(),
    partialCredit: z.boolean()
  }))
});

const updateQuizSchema = createQuizSchema.partial();

// GET /api/quiz - Get all quizzes or filter by course/chapter/lesson
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const chapterId = searchParams.get('chapterId');
    const lessonId = searchParams.get('lessonId');
    const published = searchParams.get('published');

    let whereClause: any = {};

    if (courseId) whereClause.courseId = courseId;
    if (chapterId) whereClause.chapterId = chapterId;
    if (lessonId) whereClause.lessonId = lessonId;
    if (published !== null) whereClause.isPublished = published === 'true';

    // Students can only see published and active quizzes
    if ((session.user as any).role === 'student') {
      whereClause.isPublished = true;
      whereClause.isActive = true;
    }

    const quizzes = await prisma.quiz.findMany({
      where: whereClause,
      include: {
        questions: {
          orderBy: { position: 'asc' }
        },
        course: {
          select: { title: true }
        },
        chapter: {
          select: { title: true }
        },
        lesson: {
          select: { title: true }
        },
        _count: {
          select: {
            attempts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(quizzes);

  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/quiz - Create new quiz
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and admins can create quizzes
    if ((session.user as any).role !== 'teacher' && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const validatedData = createQuizSchema.parse(body);


    const quiz = await prisma.quiz.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        courseId: validatedData.courseId,
        chapterId: validatedData.chapterId,
        lessonId: validatedData.lessonId,
        timeLimit: validatedData.timeLimit,
        passingScore: validatedData.passingScore,
        maxAttempts: validatedData.maxAttempts,
        showResults: validatedData.showResults,
        showCorrectAnswers: validatedData.showCorrectAnswers,
        randomizeQuestions: validatedData.randomizeQuestions,
        randomizeOptions: validatedData.randomizeOptions,
        availableFrom: validatedData.availableFrom ? new Date(validatedData.availableFrom) : null,
        availableTo: validatedData.availableTo ? new Date(validatedData.availableTo) : null,
        isPublished: validatedData.isPublished,
        isActive: validatedData.isActive,
        createdById: session.user.id,
        questions: {
          create: validatedData.questions.map(q => ({
            type: q.type,
            question: q.question,
            explanation: q.explanation,
            points: q.points,
            difficulty: q.difficulty,
            position: q.position,
            questionData: q.questionData ?? {},
            isRequired: q.isRequired,
            partialCredit: q.partialCredit
          }))
        }
      },
      include: {
        questions: {
          orderBy: { position: 'asc' }
        }
      }
    });


    return NextResponse.json(quiz, { status: 201 });

  } catch (error) {
    console.error('Error creating quiz:', error);

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