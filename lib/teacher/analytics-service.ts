import { prisma } from "@/lib/db";

/**
 * Teacher Analytics Service
 * Author: Sanket
 */

export async function getStudentPerformanceMetrics(studentId: string, teacherId: string) {
    // 1. Attendance Metrics
    const sessions = await prisma.liveSession.findMany({
        where: {
            studentId,
            teacherId: {
                // Ensure the teacher owns the session
                in: await prisma.teacherProfile.findMany({
                    where: { userId: teacherId },
                    select: { id: true }
                }).then(profiles => profiles.map(p => p.id))
            },
            status: { in: ["completed", "no_show"] }
        }
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === "completed").length;
    const noShowSessions = sessions.filter(s => s.status === "no_show").length;
    const attendanceRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // 2. Quiz Metrics (From quizzes created by this teacher)
    const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
            userId: studentId,
            quiz: {
                createdById: teacherId
            },
            status: "Completed"
        },
        include: {
            quiz: {
                select: { title: true }
            }
        },
        orderBy: { submittedAt: "desc" }
    });

    const averageQuizScore = quizAttempts.length > 0 
        ? quizAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / quizAttempts.length
        : 0;
    
    return {
        attendance: {
            total: totalSessions,
            completed: completedSessions,
            noShow: noShowSessions,
            rate: attendanceRate
        },
        quizzes: {
            attempts: quizAttempts.map(a => ({
                id: a.id,
                title: a.quiz.title,
                score: a.percentage,
                passed: a.passed,
                date: a.submittedAt
            })),
            averageScore: averageQuizScore
        },
        sessions: sessions.map(s => ({
            id: s.id,
            title: s.title,
            date: s.scheduledAt,
            status: s.status
        }))
    };
}

export async function generateStudentCSVReport(studentId: string, teacherId: string) {
    const metrics = await getStudentPerformanceMetrics(studentId, teacherId);
    
    let csv = "Session Title,Date,Status\n";
    metrics.sessions.forEach(s => {
        csv += `"${s.title}","${new Date(s.date).toLocaleDateString()}","${s.status}"\n`;
    });
    
    csv += `\nSummary\n`;
    csv += `Total Sessions,${metrics.attendance.total}\n`;
    csv += `Attendance Rate,${metrics.attendance.rate.toFixed(1)}%\n`;
    
    return csv;
}
