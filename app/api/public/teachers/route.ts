import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get all teachers with their profiles
    const teachers = await prisma.teacherProfile.findMany({
      where: {
        isVerified: true, // Only show verified teachers in public marketplace
      },
      // Explicit select: this endpoint is public, so earnings, email, userId
      // and verification data must never be serialised here.
      select: {
        id: true,
        bio: true,
        expertise: true,
        languages: true,
        hourlyRate: true,
        isVerified: true,
        timezone: true,
        rating: true,
        totalReviews: true,
        totalStudents: true,
        qualifications: true,
        certifications: true,
        experience: true,
        allowFreeDemo: true,
        allowFreeGroup: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            liveSessions: true,
          },
        },
      },
      orderBy: [
        {
          rating: "desc",
        },
        {
          totalStudents: "desc",
        },
      ],
      take: 50, // Limit to top 50 teachers for performance
    });

    // Calculate additional metrics for each teacher
    const teachersWithMetrics = teachers.map(teacher => ({
      ...teacher,
      completionRate: calculateProfileCompletion(teacher),
      responseRate: 95, // Mock data - implement real response rate tracking later
      avgResponseTime: "2 hours", // Mock data - implement real response time tracking later
    }));

    return NextResponse.json({ teachers: teachersWithMetrics });
  } catch (error) {
    console.error("Error fetching public teachers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function calculateProfileCompletion(teacher: any): number {
  const fields = [
    teacher.bio,
    teacher.expertise?.length > 0,
    teacher.languages?.length > 0,
    teacher.hourlyRate,
    teacher.timezone,
    teacher.qualifications?.length > 0,
    teacher.certifications?.length > 0,
  ];

  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}