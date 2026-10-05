import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/app/api/admin/_lib/guard";
import { decideTeacher } from "@/app/admin/_lib/teacher-approval";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await adminGuard();
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const { status, reviewNotes } = body as { status?: string; reviewNotes?: string };
    const { id: verificationId } = await params;
    const normalised = typeof status === "string" ? status.toLowerCase() : "";

    if (!['approved', 'rejected', 'pending'].includes(normalised)) {
      return NextResponse.json(
        { success: false, error: 'Valid status is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.teacherVerification.findUnique({
      where: { id: verificationId },
      select: { teacherId: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Approve/reject go through the same service as the admin UI so profile flags,
    // notification and email stay consistent.
    if (normalised === 'approved' || normalised === 'rejected') {
      const result = await decideTeacher(
        { profileId: existing.teacherId },
        normalised === 'approved'
          ? { decision: 'approve' }
          : { decision: 'reject', reason: reviewNotes ?? '' },
        guard.userId
      );
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.message }, { status: 400 });
      }
    } else {
      await prisma.teacherVerification.update({
        where: { id: verificationId },
        data: { status: 'Pending', reviewedAt: new Date(), reviewedById: guard.userId },
      });
    }

    if (reviewNotes) {
      await prisma.teacherVerification.update({
        where: { id: verificationId },
        data: { adminNotes: reviewNotes },
      });
    }

    const verification = await prisma.teacherVerification.findUnique({
      where: { id: verificationId },
      include: {
        teacher: {
          include: {
            user: { select: { id: true, email: true, name: true, image: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error updating verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update verification' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await adminGuard();
    if (!guard.ok) return guard.response;
    const { id } = await params;

    const verification = await prisma.teacherVerification.findUnique({
      where: { id },
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

    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error fetching verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch verification' },
      { status: 500 }
    );
  }
}