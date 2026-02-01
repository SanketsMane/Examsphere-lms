import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getCurrencyData } from "@/lib/currency";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook error: ${error.message}`, {
      status: 400,
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    // Handle different payment types based on metadata
    if (session.metadata?.type === "wallet_recharge") {
      await handleWalletRecharge(session);
    } else if (session.metadata?.type === "live_session") {
      await handleLiveSessionPayment(session);
    } else {
      // Default to Course Enrollment (Standard flow)
      await handleCourseEnrollmentPayment(session);
    }
  }

  return new NextResponse(null, { status: 200 });
}

// ----------------
// Helper: Live Session Payment
// ----------------
async function handleLiveSessionPayment(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};

  try {
    // Get the pending booking
    const booking = await prisma.sessionBooking.findFirst({
      where: {
        stripeSessionId: session.id,
        status: 'pending'
      },
      include: {
        session: {
          include: {
            teacher: {
              include: {
                user: true
              }
            }
          }
        },
        student: true
      }
    });

    if (!booking) {
      logger.error('No pending booking found for session', { sessionId: session.id });
      return;
    }

    // Idempotency: Atomic update
    const updateResult = await prisma.sessionBooking.updateMany({
      where: { 
        id: booking.id,
        status: 'pending' 
      },
      data: {
        status: 'confirmed',
        stripePaymentIntentId: session.payment_intent as string,
        paymentCompletedAt: new Date()
      }
    });

    if (updateResult.count === 0) {
       logger.info(`Booking already processed`, { bookingId: booking.id });
       return;
    }

    // Update live session status
    await prisma.liveSession.update({
      where: { id: booking.sessionId },
      data: {
        status: 'scheduled',
      }
    });

    // Create commission record for teacher
    const commissionRate = 0.20; // 20% platform fee
    const commissionAmount = Math.round(booking.amount * commissionRate);
    const netAmount = booking.amount - commissionAmount;

    // Correct access to teacher profile ID via session relation
    const teacherProfileId = booking.session.teacherId;
    // Correct access to teacher User ID via session -> teacher -> user
    const teacherUserId = booking.session.teacher.userId;

    await prisma.commission.create({
      data: {
        teacherId: teacherProfileId,
        sessionId: booking.sessionId,
        type: 'LiveSession',
        amount: booking.amount,
        commission: commissionAmount,
        netAmount: netAmount,
        status: 'Pending'
      }
    });

    // Notifications
    await prisma.notification.createMany({
      data: [
        { userId: booking.studentId, title: "Booking Confirmed", message: `Your session "${booking.session.title}" is confirmed!`, type: "Session" },
        { userId: teacherUserId, title: "New Session Booking", message: `${booking.student.name} booked "${booking.session.title}"`, type: "Session" }
      ]
    });

    // Send Emails (Lazy import)
    const { sendTemplatedEmail } = await import("@/lib/email");
    await sendTemplatedEmail("notification", booking.student.email, "Booking Confirmed", {
      userName: booking.student.name || 'Student',
      title: "Session Booked",
      messageTitle: booking.session.title,
      message: `Your session is scheduled for ${new Date(booking.session.scheduledAt).toLocaleString()}.`
    });

    logger.info(`Live session booking confirmed`, { bookingId: booking.id });
  } catch (error) {
    logger.error("Live session payment error", error as Error);
    throw error;
  }
}

// ----------------
// Helper: Wallet Recharge Payment
// ----------------
async function handleWalletRecharge(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const userId = metadata.userId;
  const amount = parseInt(metadata.amount || "0");

  if (!userId || !amount) {
    logger.error("Missing userId or amount in wallet recharge metadata", { sessionId: session.id });
    return;
  }

  try {
    // Check for duplicate processing (idempotency)
    const existingTransaction = await prisma.walletTransaction.findFirst({
      where: { stripeSessionId: session.id }
    });

    if (existingTransaction) {
      logger.info("Wallet recharge already processed", { sessionId: session.id });
      return;
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0 }
      });
    }

    // Get user country for currency symbol
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true }
    });
    const currency = getCurrencyData(dbUser?.country);
    
    // Convert local amount back to USD (internal base)
    // We use the same factor to ensure mathematical stability
    const amountInUsd = amount / currency.factor;

    // Atomic transaction to update balance and create transaction record
    await prisma.$transaction(async (tx) => {
      const balanceBefore = wallet!.balance;
      const balanceAfter = balanceBefore + amountInUsd;

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet!.id },
        data: { balance: balanceAfter }
      });

      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          type: "RECHARGE",
          amount: amountInUsd,
          balanceBefore,
          balanceAfter,
          description: `Wallet recharge of ${currency.symbol}${amount}`,
          stripeSessionId: session.id,
          metadata: {
            paymentIntentId: session.payment_intent as string,
            customerEmail: session.customer_email
          }
        }
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          title: "Wallet Recharged",
          message: `${currency.symbol}${amount} has been added to your wallet. New balance: ${currency.symbol}${balanceAfter}`,
          type: "Payment"
        }
      });
    });

    logger.info(`Wallet recharge successful`, { amount, amountInUsd, userId, currency: currency.code });
  } catch (error) {
    logger.error("Wallet recharge error", error as Error, userId);
    throw error;
  }
}
// ----------------
// Helper: Course Enrollment Payment
// ----------------
async function handleCourseEnrollmentPayment(session: Stripe.Checkout.Session) {
  const courseId = session.metadata?.courseId;
  const enrollmentId = session.metadata?.enrollmentId;

  if (!courseId || !enrollmentId) {
    logger.error("Missing metadata for course enrollment", { sessionId: session.id });
    return;
  }

  // Idempotency: Use atomic updateMany to transition from Pending to Active.
  // This ensures that only ONE concurrent request can claim the update.
  const updateResult = await prisma.enrollment.updateMany({
    where: { 
      id: enrollmentId,
      status: "Pending" // Only update if currently pending
    },
    data: { status: "Active" } 
  });

  if (updateResult.count === 0) {
    // Either didn't exist or was already Active (processed)
    logger.info(`Enrollment already processed or invalid`, { enrollmentId });
    return;
  }

  // Reload enrollment to get fresh data for notifications (it allows reading relations)
  // We know it exists because we just updated it.
  const updatedEnrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      Course: {
        include: {
          user: {
            include: {
              teacherProfile: true
            }
          }
        }
      },
      User: true
    }
  });

  if (!updatedEnrollment || !updatedEnrollment.Course.user.teacherProfile) {
    logger.error("Enrollment updated but data missing for commission/notifications", { enrollmentId });
    return;
  }

  const amount = session.amount_total || 0;
  const platformFeeRate = 0.20; 
  const commissionAmount = Math.round(amount * platformFeeRate);
  const netAmount = amount - commissionAmount;

  try {
    await prisma.$transaction([
      // Create Commission
      prisma.commission.create({
        data: {
          teacherId: updatedEnrollment.Course.user.teacherProfile.id,
          courseId: courseId,
          type: "Course",
          amount: amount,
          commission: commissionAmount,
          netAmount: netAmount,
          status: "Pending",
        }
      }),
      // Notifications
      prisma.notification.create({
        data: {
          userId: updatedEnrollment.userId,
          title: "Enrollment Successful!",
          message: `Welcome to ${updatedEnrollment.Course.title}. Your payment was confirmed.`,
          type: "Payment",
        }
      }),
      prisma.notification.create({
        data: {
          userId: updatedEnrollment.Course.user.id,
          title: "New Course Sale!",
          message: `Someone just enrolled in ${updatedEnrollment.Course.title}.`,
          type: "Payment",
        }
      })
    ]);

    // Send Emails (Non-blocking)
    const { sendTemplatedEmail } = await import("@/lib/email");

    await sendTemplatedEmail("courseEnrollment", updatedEnrollment.User.email, "Enrollment Confirmed", {
      userName: updatedEnrollment.User.name || "Student",
      courseTitle: updatedEnrollment.Course.title,
      courseDescription: updatedEnrollment.Course.description || "Start learning today!",
      enrollmentDate: new Date().toLocaleDateString(),
      courseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/courses/${updatedEnrollment.Course.slug}`
    });

    await sendTemplatedEmail("notification", updatedEnrollment.Course.user.email, "New Course Sale", {
      userName: updatedEnrollment.Course.user.name || "Instructor",
      title: "New Student Enrolled",
      messageTitle: `Sold: ${updatedEnrollment.Course.title}`,
      message: `You earned $${(netAmount / 100).toFixed(2)} from this sale.`
    });

  } catch (error) {
    logger.error("Error creating post-enrollment records", error as Error, updatedEnrollment.userId);
    // Note: Enrollment is already Active, but commission/notifs failed.
    // In strict system, we might want to revert enrollment, but that complicates things.
    // Ideally use interactive transaction for ALL of it, but updateMany + relations is tricky.
    // This is "good enough" for now as double-commission is the main financial risk, which is solved by updateMany gate.
  }
}
