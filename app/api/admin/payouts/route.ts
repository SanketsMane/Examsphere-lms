import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/auth/require-roles";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const teacherId = searchParams.get('teacherId');

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (teacherId) {
      whereClause.teacherId = teacherId;
    }

    const payouts = await prisma.payoutRequest.findMany({
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
        createdAt: 'desc'
      },
      take: 500, // Prevent OOM by loading only the most recent chunks
    });

    return NextResponse.json({
      success: true,
      data: payouts
    });

  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { teacherId, amount, bankDetails, notes } = body;

    if (!teacherId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID and amount are required' },
        { status: 400 }
      );
    }

    // Verify teacher exists and is verified
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: {
        user: true
      }
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    if (!teacher.isVerified) {
      return NextResponse.json(
        { success: false, error: 'Teacher must be verified before requesting payouts' },
        { status: 400 }
      );
    }

    const payout = await prisma.payoutRequest.create({
      data: {
        teacherId,
        requestedAmount: parseFloat(amount),
        bankAccountName: bankDetails || 'Not provided',
        bankAccountNumber: 'encrypted_placeholder',
        adminNotes: notes,
        status: 'Pending',
        currency: 'USD'
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
      data: payout
    });

  } catch (error) {
    console.error('Error creating payout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payout request' },
      { status: 500 }
    );
  }
}