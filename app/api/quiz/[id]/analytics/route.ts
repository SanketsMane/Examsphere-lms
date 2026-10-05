import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/quiz/[id]/analytics - Get quiz analytics
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

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { position: 'asc' }
        },
        attempts: {
          where: { status: 'Submitted' },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            responses: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const role = (session.user as any).role;
    const isStaff = role === 'teacher' || role === 'admin';

    // A teacher may only see class-wide analytics for quizzes they created.
    if (role === 'teacher' && quiz.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check permissions
    if (!isStaff) {
      // Students can only see their own analytics
      const userAttempts = quiz.attempts.filter(a => a.userId === session.user.id);

      if (userAttempts.length === 0) {
        return NextResponse.json({ error: "No attempts found" }, { status: 404 });
      }

      // Return student-specific analytics
      const bestAttempt = userAttempts.reduce((best, current) =>
        (current.totalPoints || 0) > (best.totalPoints || 0) ? current : best
      );

      return NextResponse.json({
        quiz: {
          id: quiz.id,
          title: quiz.title,
          totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
          passingScore: quiz.passingScore
        },
        studentAnalytics: {
          totalAttempts: userAttempts.length,
          bestScore: bestAttempt.totalPoints || 0,
          bestScorePercentage: Math.round(((bestAttempt.totalPoints || 0) / (bestAttempt.maxPoints || 1)) * 100),
          averageScore: Math.round(userAttempts.reduce((sum, a) => sum + (a.totalPoints || 0), 0) / userAttempts.length),
          passed: (bestAttempt.totalPoints || 0) / (bestAttempt.maxPoints || 1) * 100 >= quiz.passingScore,
          attempts: userAttempts.map(attempt => ({
            id: attempt.id,
            score: attempt.totalPoints,
            scorePercentage: Math.round(((attempt.totalPoints || 0) / (attempt.maxPoints || 1)) * 100),
            submittedAt: attempt.submittedAt,
            timeSpent: attempt.timeSpent,
            passed: (attempt.totalPoints || 0) / (attempt.maxPoints || 1) * 100 >= quiz.passingScore
          }))
        }
      });
    }

    // Teacher/Admin analytics
    const submittedAttempts = quiz.attempts;
    const totalAttempts = submittedAttempts.length;

    if (totalAttempts === 0) {
      return NextResponse.json({
        quiz: {
          id: quiz.id,
          title: quiz.title,
          totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
          passingScore: quiz.passingScore,
          questionsCount: quiz.questions.length
        },
        analytics: {
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0,
          completionRate: 0,
          questionAnalytics: [],
          difficultyAnalytics: [],
          timeAnalytics: {
            averageTimeSpent: 0,
            fastestTime: 0,
            slowestTime: 0
          }
        }
      });
    }

    // Calculate overall stats
    const scores = submittedAttempts.map(a => a.totalPoints || 0);
    const percentages = submittedAttempts.map(a => ((a.totalPoints || 0) / (a.maxPoints || 1)) * 100);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
    const averagePercentage = percentages.reduce((sum, pct) => sum + pct, 0) / totalAttempts;
    const passCount = percentages.filter(pct => pct >= quiz.passingScore).length;
    const passRate = (passCount / totalAttempts) * 100;

    // Question analytics
    const questionAnalytics = quiz.questions.map(question => {
      const questionResponses = submittedAttempts.flatMap(attempt =>
        attempt.responses.filter(r => r.questionId === question.id)
      );

      const correctCount = questionResponses.filter(r => r.isCorrect).length;
      const totalResponses = questionResponses.length;
      const averagePoints = questionResponses.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0) / Math.max(totalResponses, 1);
      const averageTime = questionResponses.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / Math.max(totalResponses, 1);

      return {
        questionId: question.id,
        question: question.question,
        type: question.type,
        difficulty: question.difficulty,
        points: question.points,
        correctCount,
        totalResponses,
        accuracyRate: totalResponses > 0 ? (correctCount / totalResponses) * 100 : 0,
        averagePoints,
        averageTime,
        commonWrongAnswers: getCommonWrongAnswers(question, questionResponses.filter(r => !r.isCorrect))
      };
    });

    // Difficulty analytics
    const difficultyGroups = quiz.questions.reduce((groups, question) => {
      if (!groups[question.difficulty]) {
        groups[question.difficulty] = [];
      }
      groups[question.difficulty].push(question);
      return groups;
    }, {} as Record<string, any[]>);

    const difficultyAnalytics = Object.entries(difficultyGroups).map(([difficulty, questions]) => {
      const difficultyResponses = submittedAttempts.flatMap(attempt =>
        attempt.responses.filter(r => questions.some(q => q.id === r.questionId))
      );

      const correctCount = difficultyResponses.filter(r => r.isCorrect).length;
      const totalResponses = difficultyResponses.length;

      return {
        difficulty,
        questionCount: questions.length,
        correctCount,
        totalResponses,
        accuracyRate: totalResponses > 0 ? (correctCount / totalResponses) * 100 : 0,
        averageTime: difficultyResponses.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / Math.max(totalResponses, 1)
      };
    });

    // Time analytics
    const times = submittedAttempts.map(a => a.timeSpent || 0);
    const timeAnalytics = {
      averageTimeSpent: times.reduce((sum, time) => sum + time, 0) / totalAttempts,
      fastestTime: Math.min(...times),
      slowestTime: Math.max(...times),
      timeDistribution: getTimeDistribution(times)
    };

    // Score distribution
    const scoreDistribution = getScoreDistribution(percentages);

    // Student performance
    const studentPerformance = submittedAttempts
      .reduce((students, attempt) => {
        if (!students[attempt.userId]) {
          students[attempt.userId] = {
            user: attempt.user,
            attempts: []
          };
        }
        students[attempt.userId].attempts.push(attempt);
        return students;
      }, {} as Record<string, any>)
      .map((student: any) => {
        const bestAttempt = student.attempts.reduce((best: any, current: any) =>
          (current.totalPoints || 0) > (best.totalPoints || 0) ? current : best
        );

        return {
          user: student.user,
          totalAttempts: student.attempts.length,
          bestScore: bestAttempt.totalPoints || 0,
          bestScorePercentage: Math.round(((bestAttempt.totalPoints || 0) / (bestAttempt.maxPoints || 1)) * 100),
          averageScore: Math.round(student.attempts.reduce((sum: number, a: any) => sum + (a.totalPoints || 0), 0) / student.attempts.length),
          passed: (bestAttempt.totalPoints || 0) / (bestAttempt.maxPoints || 1) * 100 >= quiz.passingScore,
          lastAttemptDate: new Date(Math.max(...student.attempts.map((a: any) => new Date(a.submittedAt).getTime())))
        };
      })
      .sort((a: any, b: any) => b.bestScore - a.bestScore);

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
        passingScore: quiz.passingScore,
        questionsCount: quiz.questions.length
      },
      analytics: {
        totalAttempts,
        uniqueStudents: Object.keys(studentPerformance).length,
        averageScore: Math.round(averageScore),
        averagePercentage: Math.round(averagePercentage),
        passRate: Math.round(passRate),
        completionRate: 100, // All included attempts are completed
        questionAnalytics,
        difficultyAnalytics,
        timeAnalytics,
        scoreDistribution,
        studentPerformance
      }
    });

  } catch (error) {
    console.error('Error fetching quiz analytics:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function getCommonWrongAnswers(question: any, wrongResponses: any[]): any[] {
  const answerCounts = wrongResponses.reduce((counts, response) => {
    const answer = JSON.stringify(response.answer);
    counts[answer] = (counts[answer] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return (Object.entries(answerCounts) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([answer, count]) => ({
      answer: JSON.parse(answer),
      count,
      percentage: Math.round((count / wrongResponses.length) * 100)
    }));
}

function getTimeDistribution(times: number[]): any[] {
  const ranges = [
    { min: 0, max: 60, label: '< 1 min' },
    { min: 60, max: 300, label: '1-5 min' },
    { min: 300, max: 600, label: '5-10 min' },
    { min: 600, max: 1200, label: '10-20 min' },
    { min: 1200, max: 1800, label: '20-30 min' },
    { min: 1800, max: Infinity, label: '> 30 min' }
  ];

  return ranges.map(range => {
    const count = times.filter(time => time >= range.min && time < range.max).length;
    return {
      label: range.label,
      count,
      percentage: Math.round((count / times.length) * 100)
    };
  });
}

function getScoreDistribution(percentages: number[]): any[] {
  const ranges = [
    { min: 0, max: 50, label: '0-49%', color: 'red' },
    { min: 50, max: 60, label: '50-59%', color: 'blue' },
    { min: 60, max: 70, label: '60-69%', color: 'yellow' },
    { min: 70, max: 80, label: '70-79%', color: 'blue' },
    { min: 80, max: 90, label: '80-89%', color: 'green' },
    { min: 90, max: 100, label: '90-100%', color: 'emerald' }
  ];

  return ranges.map(range => {
    const count = percentages.filter(pct => pct >= range.min && pct <= range.max).length;
    return {
      label: range.label,
      count,
      percentage: Math.round((count / percentages.length) * 100),
      color: range.color
    };
  });
}