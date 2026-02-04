import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { headers } from "next/headers";
import { differenceInHours } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { reason } = await req.json();

    // Get the booking
    const booking = await db.sessionBooking.findFirst({
      where: {
        id,
        studentId: userId
      },
      include: {
        session: {
          include: {
            teacher: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if already cancelled
    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      return NextResponse.json(
        { error: "Booking already cancelled" },
        { status: 400 }
      );
    }

    // Check if session is in the past
    if (booking.session.scheduledAt && booking.session.scheduledAt < new Date()) {
      return NextResponse.json(
        { error: "Cannot cancel past sessions" },
        { status: 400 }
      );
    }

    // Calculate refund amount based on cancellation policy
    const hoursUntilSession = booking.session.scheduledAt
      ? differenceInHours(booking.session.scheduledAt, new Date())
      : 0;

    let refundPercentage = 0;
    if (hoursUntilSession >= 48) {
      refundPercentage = 1.0; // 100% refund
    } else if (hoursUntilSession >= 24) {
      refundPercentage = 0.5; // 50% refund
    } else {
      refundPercentage = 0; // No refund
    }

    const refundAmount = Math.round(booking.amount * refundPercentage);

    // Process refund via Razorpay if applicable (Author: Sanket)
    let razorpayRefundId = null;
    if (refundAmount > 0 && booking.razorpayPaymentId) {
      try {
        const { getRazorpayInstance } = await import("@/lib/razorpay");
        const razorpay = await getRazorpayInstance();
        const refund = await razorpay.payments.refund(booking.razorpayPaymentId, {
          amount: refundAmount,
          notes: {
            reason: reason || 'requested_by_customer',
            bookingId: booking.id
          }
        });
        razorpayRefundId = refund.id;
      } catch (rzpError: any) {
        console.error('Razorpay refund error:', rzpError);
        return NextResponse.json(
          { 
            error: "Refund processing failed via Razorpay. Please contact support.",
            details: rzpError.message 
          },
          { status: 500 }
        );
      }
    }

    // Update booking
    const cancelledBooking = await db.sessionBooking.update({
      where: { id: booking.id },
      data: {
        status: refundAmount > 0 ? 'refunded' : 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        refundAmount: refundAmount,
        refundedAt: refundAmount > 0 ? new Date() : null
      }
    });

    // Update session status (Assuming 1-on-1 for now, as per existing logic)
    await db.liveSession.update({
      where: { id: booking.sessionId },
      data: {
        status: 'cancelled',
        cancelledBy: 'student',
        cancellationReason: reason,
        refundAmount: refundAmount
      }
    });

    // Handle Commission Reversal (Negative Commission)
    if (refundAmount > 0) {
      const commissionRate = 0.20;
      const reversalCommission = Math.round(refundAmount * commissionRate);
      const reversalNet = refundAmount - reversalCommission;

      // CRITICAL FIX: Check teacher's available balance before reversal
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { id: booking.session.teacherId },
        select: { totalEarnings: true }
      });

      if (!teacherProfile) {
        console.error('Teacher profile not found for commission reversal', { teacherId: booking.session.teacherId });
        // Continue with cancellation but log the issue
      } else {
        // Calculate available balance (total earnings minus pending/completed payouts)
        const payouts = await db.payoutRequest.findMany({
          where: {
            teacherId: booking.session.teacherId,
            status: { notIn: ['Rejected', 'Failed', 'Cancelled'] }
          }
        });

        const totalPaidOut = payouts.reduce((sum, p) => sum + Number(p.requestedAmount), 0);
        const availableBalance = Number(teacherProfile.totalEarnings) - totalPaidOut;

        // If insufficient balance, create a debt record instead of allowing negative balance
        if (availableBalance < reversalNet) {
          console.warn('Insufficient teacher balance for commission reversal', {
            teacherId: booking.session.teacherId,
            availableBalance,
            reversalAmount: reversalNet
          });
          
          // Create notification for admin to handle manually
          await db.notification.create({
            data: {
              userId: booking.session.teacher.userId,
              title: 'Commission Reversal - Insufficient Balance',
              message: `A refund of $${(refundAmount / 100).toFixed(2)} requires commission reversal, but your available balance is insufficient. This will be deducted from future earnings.`,
              type: 'Payment'
            }
          });
        }
      }

      await db.commission.create({
        data: {
          teacherId: booking.session.teacherId,
          sessionId: booking.sessionId,
          type: 'LiveSession',
          amount: -refundAmount, // Negative
          commission: -reversalCommission, // Negative
          netAmount: -reversalNet, // Negative
          status: 'Pending' // Will be deducted from next payout
        }

      });
    }

    // Send Emails
    const { sendTemplatedEmail } = await import("@/lib/email");
    const sessionDate = booking.session.scheduledAt ? new Date(booking.session.scheduledAt).toLocaleString() : 'Scheduled Date';

    // To Student
    await sendTemplatedEmail("notification", session.user.email, "Booking Cancelled", {
      userName: session.user.name || 'Student',
      title: "Cancellation Confirmed",
      messageTitle: booking.session.title,
      message: `Your booking for "${booking.session.title}" on ${sessionDate} has been cancelled. Refund: $${(refundAmount / 100).toFixed(2)}.`
    });

    // To Teacher
    if (booking.session.teacher.user.email) {
      await sendTemplatedEmail("notification", booking.session.teacher.user.email, "Session Cancelled", {
        userName: booking.session.teacher.user.name || 'Teacher',
        title: "Student Cancelled Session",
        messageTitle: booking.session.title,
        message: `${session.user.name} has cancelled the session scheduled for ${sessionDate}.`
      });
    }

    return NextResponse.json({
      success: true,
      refundAmount: refundAmount,
      refundPercentage: refundPercentage * 100
    });
  } catch (error: any) {
    console.error('Cancellation error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
