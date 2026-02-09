import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
// Removed Stripe import - Author: Sanket

export const dynamic = "force-dynamic";

// POST - Cancel a session
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { reason, refundType = 'auto' } = body; // refundType: 'auto', 'full', 'partial', 'none'

    const liveSession = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        // We need all bookings to process refunds
        bookings: {
          where: {
            status: 'confirmed'
          },
          include: {
            student: true
          }
        }
      }
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify teacher owns this session
    if (liveSession.teacher.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can't cancel already completed or cancelled sessions
    if (liveSession.status === 'completed' || liveSession.status === 'cancelled') {
      return NextResponse.json(
        { error: `Session is already ${liveSession.status}` },
        { status: 400 }
      );
    }

    // 1. Calculate Refund Percentage
    let refundPercentage = 0;
    const now = new Date();
    const sessionTime = new Date(liveSession.scheduledAt);
    const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (refundType === 'auto') {
      if (hoursUntilSession >= 48) { refundPercentage = 1; }
      else if (hoursUntilSession >= 24) { refundPercentage = 0.5; }
      else { refundPercentage = 0; }
    } else if (refundType === 'full') {
      refundPercentage = 1;
    } else if (refundType === 'partial') {
      refundPercentage = 0.5;
    } else {
      refundPercentage = 0;
    }

    // 2. Process Refunds for All Bookings
    let totalRefundAmount = 0;
    const processedBookings = [];

    for (const booking of liveSession.bookings) {
      let refundAmount = Math.round(booking.amount * refundPercentage);

      if (refundAmount > 0) {
        if (booking.razorpayPaymentId) {
          try {
            const { getRazorpayInstance } = await import("@/lib/razorpay");
            const razorpay = await getRazorpayInstance();
            await razorpay.payments.refund(booking.razorpayPaymentId, {
              amount: refundAmount,
              notes: {
                sessionId: liveSession.id,
                cancelledBy: 'teacher',
                reason: reason || 'Teacher cancelled'
              }
            });
          } catch (rzpError) {
            console.error(`Razorpay refund failed for booking ${booking.id}:`, rzpError);
          }
        }
      }

      totalRefundAmount += refundAmount;
      processedBookings.push({ booking, refundAmount });

      // Update Booking Status
      await prisma.sessionBooking.update({
        where: { id: booking.id },
        data: {
          status: refundAmount > 0 ? 'refunded' : 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason,
          refundAmount: refundAmount,
          refundedAt: refundAmount > 0 ? new Date() : null
        }
      });
    }

    // 3. Update Session Status
    const updatedSession = await prisma.liveSession.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledBy: 'teacher',
        cancellationReason: reason,
        refundAmount: totalRefundAmount
      }
    });

    // 4. Handle Commission Reversal (Aggregate)
    if (totalRefundAmount > 0) {
      const commissionRate = 0.20;
      const totalCommissionReversal = Math.round(totalRefundAmount * commissionRate);
      const totalNetReversal = totalRefundAmount - totalCommissionReversal; // This is what teacher loses

      await prisma.commission.create({
        data: {
          teacherId: liveSession.teacherId,
          sessionId: liveSession.id,
          type: 'LiveSession',
          amount: -totalRefundAmount,
          commission: -totalCommissionReversal,
          netAmount: -totalNetReversal,
          status: 'Pending'
        }
      });
    }

    // 5. Send Notifications & Emails (Non-blocking)
    const { createSessionNotification } = await import("@/app/actions/notifications");
    const { sendTemplatedEmail } = await import("@/lib/email");
    const sessionDateStr = new Date(liveSession.scheduledAt).toLocaleString();

    // Notify Students
    await Promise.all(processedBookings.map(async ({ booking, refundAmount }) => {
      if (booking.student && booking.student.id) {
        // In-app notification
        await createSessionNotification(booking.student.id, liveSession.id, "cancelled");
        
        // Professional Email
        if (booking.student.email) {
          await sendTemplatedEmail("sessionCancelled", booking.student.email, "Session Cancelled by Teacher", {
            userName: booking.student.name || 'Student',
            sessionTitle: liveSession.title,
            sessionDate: sessionDateStr,
            reason: reason || 'Teacher cancelled the session',
            introMessage: "We're sorry to inform you that your upcoming session has been cancelled by the teacher.",
            refundAmount: (refundAmount / 100).toFixed(2)
          });
        }
      }
    }));

    return NextResponse.json({
      message: "Session cancelled successfully",
      session: updatedSession,
      totalRefundAmount,
      refundPolicy: refundPercentage === 1 ? 'full' : (refundPercentage > 0 ? 'partial' : 'none'),
      processedCount: processedBookings.length
    });

  } catch (error) {
    console.error("Error cancelling session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
