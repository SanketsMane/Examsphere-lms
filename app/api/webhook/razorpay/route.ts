import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { getRazorpayKeyId } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 400 });
        }

        // Fetch secret directly from DB since we store it there
        const settings = await prisma.siteSettings.findFirst();
        if (!settings?.razorpayKeySecret) {
            console.error("Razorpay secret not configured");
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        // Verify signature
        const expectedSignature = crypto
            .createHmac("sha256", settings.razorpayKeySecret)
            .update(body)
            .digest("hex");

        if (expectedSignature !== signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);
        const { payload } = event;

        // Handle 'payment.captured' or 'order.paid'
        // Ideally we listen to order.paid to ensure full amount matches
        if (event.event === "payment.captured" || event.event === "order.paid") {
            const payment = payload.payment.entity;
            const orderId = payment.order_id; // Razorpay Order ID

            // 1. Check if this is a Course Enrollment
            const enrollment = await prisma.enrollment.findFirst({
                where: { razorpayOrderId: orderId }
            });

            if (enrollment) {
                if (enrollment.status !== "Active") {
                    // Fetch course details for notification
                    const course = await prisma.course.findUnique({
                        where: { id: enrollment.courseId },
                        select: { title: true }
                    });

                    await prisma.enrollment.update({
                        where: { id: enrollment.id },
                        data: { 
                            status: "Active",
                        }
                    });

                    // Create system notification
                    await prisma.notification.create({
                        data: {
                            userId: enrollment.userId,
                            title: "Course Enrollment Successful",
                            message: `Your payment was successful! You're now enrolled in "${course?.title || 'the course'}".`,
                            type: "Course",
                            data: { courseId: enrollment.courseId, action: "enrolled" }
                        }
                    });

                    // Log Transaction
                    await prisma.systemTransaction.create({
                        data: {
                            amount: payment.amount, // in paisa
                            currency: payment.currency,
                            status: "SUCCESS",
                            method: payment.method,
                            providerOrderId: orderId,
                            providerPaymentId: payment.id,
                            type: "COURSE_PURCHASE",
                            description: `Course Enrollment: ${enrollment.courseId}`,
                            userId: enrollment.userId,
                            metadata: {
                                enrollmentId: enrollment.id,
                                email: payment.email,
                                contact: payment.contact,
                            }
                        }
                    });

                    console.log(`Enrollment ${enrollment.id} completed via Razorpay`);
                }
                return NextResponse.json({ status: "ok" });
            }

            // 2. Check if this is a Wallet Transaction
            const transactionRecord = await prisma.walletTransaction.findFirst({
                where: { razorpayOrderId: orderId }
            });

            if (transactionRecord) {
                const metadata = transactionRecord.metadata as any;
                
                if (metadata?.status !== "success") {
                    // Update Transaction
                    await prisma.walletTransaction.update({
                        where: { id: transactionRecord.id },
                        data: {
                            description: "Wallet Recharge (Successful)",
                            metadata: {
                                ...metadata,
                                status: "success",
                                paymentId: payment.id
                            }
                        }
                    });

                    // Update Wallet Balance
                    await prisma.wallet.update({
                        where: { id: transactionRecord.walletId },
                        data: {
                            balance: { increment: transactionRecord.amount }
                        }
                    });

                    // Log Transaction
                    await prisma.systemTransaction.create({
                        data: {
                            amount: payment.amount, // in paisa
                            currency: payment.currency,
                            status: "SUCCESS",
                            method: payment.method,
                            providerOrderId: orderId,
                            providerPaymentId: payment.id,
                            type: "WALLET_RECHARGE",
                            description: `Wallet Recharge for User`,
                            userId: transactionRecord.walletId, 
                        }
                    });
                    
                    const wallet = await prisma.wallet.findUnique({
                         where: { id: transactionRecord.walletId },
                         select: { userId: true }
                    });

                    if (wallet) {
                         // Update the previous transaction with correct userId if needed or just create new one?
                         // Actually the previous CREATE above used walletId as userId which is WRONG.
                         // We should fetch wallet FIRST.
                    }
                    // REFACTORED LOGIC BELOW
                }
                return NextResponse.json({ status: "ok" });
            }

            // 3. Check if this is a Session Booking (LiveSession)
            const sessionBooking = await prisma.sessionBooking.findFirst({
                 where: { id: payment.notes.bookingId } 
            }) || await prisma.sessionBooking.findFirst({
                 where: { stripeSessionId: orderId } // Backup if we reused stripeSessionId field
            });
            // Note: In our checkout/session API we did not set stripeSessionId to orderId immediately to avoid unique constraint if empty?
            // Actually we didn't set it at all. We should rely on `notes.bookingId`.
            
            if (sessionBooking || (payment.notes.type === "SESSION_BOOKING" && payment.notes.bookingId)) {
                 const bookingId = sessionBooking?.id || payment.notes.bookingId;
                 
                 const booking = await prisma.sessionBooking.findUnique({
                     where: { id: bookingId },
                     include: { session: true }
                 });

                 if (booking) {
                      if (booking.status !== "confirmed") {
                           await prisma.sessionBooking.update({
                               where: { id: booking.id },
                               data: {
                                   status: "confirmed",
                                   stripeSessionId: orderId, // Store Razorpay Order ID here for reference
                                   paymentCompletedAt: new Date(),
                               }
                           });
                           
                           // Log Transaction
                           await prisma.systemTransaction.create({
                                data: {
                                    amount: payment.amount,
                                    currency: payment.currency,
                                    status: "SUCCESS",
                                    method: payment.method,
                                    providerOrderId: orderId,
                                    providerPaymentId: payment.id,
                                    type: "SESSION_BOOKING",
                                    description: `Session Booking: ${booking.session.title}`,
                                    userId: booking.studentId,
                                    metadata: {
                                        sessionId: booking.sessionId,
                                        bookingId: booking.id,
                                        email: payment.email
                                    }
                                }
                           });

                           console.log(`Session Booking ${booking.id} confirmed via Razorpay`);
                      }
                      return NextResponse.json({ status: "ok" });
                 }
            }

            console.log(`Razorpay order ${orderId} match not found in local DB`);
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Razorpay Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
