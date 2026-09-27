import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/app/api/admin/_lib/guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const guard = await adminGuard();
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.verificationType = type;
    }

    const verifications = await prisma.teacherVerification.findMany({
      where: whereClause,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                image: true,
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: verifications
    });

  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await adminGuard();
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const { teacherId, verificationType, documents, notes } = body;

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    const verification = await prisma.teacherVerification.upsert({
      where: { teacherId },
      create: {
        teacherId,
        adminNotes: notes,
        status: 'Pending',
        submittedAt: new Date()
      },
      update: {
        adminNotes: notes,
        submittedAt: new Date()
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                image: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error creating verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create verification' },
      { status: 500 }
    );
  }
}