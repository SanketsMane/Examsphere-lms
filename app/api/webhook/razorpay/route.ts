import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReceiptEmail, sendNotificationEmail } from "@/lib/email-notifications";
import crypto from "crypto";
import { calculatePlatformCommission } from "@/lib/finance";

// Handle stale Prisma types
interface ExtendedUserSubscription {
    id: string;
    userId: string;
    planId: string;
    status: string;
    razorpaySubscriptionId?: string | null;
    user?: any;
    plan?: any;
}

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
        const webhookSecret = settings?.razorpayWebhookSecret || settings?.razorpayKeySecret;

        if (!webhookSecret) {
            console.error("Razorpay secret not configured");
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        // Verify signature
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
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
                            razorpayPaymentId: payment.id // Store Payment ID for refunds - Author: Sanket
                        }
                    });
                    
                    // Get course with teacher info
                    const courseWithTeacher = await prisma.course.findUnique({
                        where: { id: enrollment.courseId },
                        include: { user: { include: { teacherProfile: true } } }
                    });

                    // 1a. Handle Commission (Author: Sanket)
                    const { platformFee, teacherNet } = await calculatePlatformCommission(
                        payment.amount, 
                        courseWithTeacher?.user.teacherProfile?.id
                    );

                    if (courseWithTeacher?.user.teacherProfile) {
                        await prisma.commission.create({
                            data: {
                                teacherId: courseWithTeacher.user.teacherProfile.id,
                                courseId: enrollment.courseId,
                                type: "Course",
                                amount: payment.amount,
                                commission: platformFee,
                                netAmount: teacherNet,
                                status: "Pending"
                            }
                        });
                    }

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

                     // Send Receipt Email (Author: Sanket)
                     if (payment.email) {
                        try {
                             await sendReceiptEmail(
                                 payment.email,
                                 payload.payment.entity.notes.userName || "Student",
                                 `Course Purchase: ${course?.title}`,
                                 (payment.amount / 100).toFixed(2) + " " + payment.currency,
                                 payment.id
                             );

                             // Send Payment Successful Email
                             const { sendTemplatedEmail } = await import("@/lib/email");
                             await sendTemplatedEmail(
                                "paymentSuccessful",
                                payment.email,
                                "Payment Successful",
                                {
                                    userName: payload.payment.entity.notes.userName || "Student",
                                    itemName: course?.title || "Course",
                                    amount: (payment.amount / 100).toFixed(2) + " " + payment.currency,
                                    transactionId: payment.id
                                }
                             );
                        } catch (e) {
                            console.error("Failed to send course receipt email", e);
                        }

                        // Send Payment Successful Email
                         try {
                             const { sendTemplatedEmail } = await import("@/lib/email");
                             await sendTemplatedEmail(
                                "paymentSuccessful",
                                payment.email,
                                "Payment Successful",
                                {
                                    userName: payload.payment.entity.notes.userName || "Student",
                                    itemName: course?.title || "Course",
                                    amount: (payment.amount / 100).toFixed(2) + " " + payment.currency,
                                    transactionId: payment.id
                                }
                             );
                         } catch (e) {
                             console.error("Failed to send payment success email", e);
                         }
                     }

                    console.log(`Enrollment ${enrollment.id} completed via Razorpay`);

                    // 1b. Trigger Referral Reward (Author: Sanket)
                    try {
                        const { rewardReferrer } = await import("@/app/actions/referrals");
                        await rewardReferrer(enrollment.userId);
                    } catch (e) {
                        console.error("Failed to trigger referral reward for enrollment", e);
                    }
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
                    // Fetch wallet and user first
                    const wallet = await prisma.wallet.findUnique({
                        where: { id: transactionRecord.walletId },
                        select: { userId: true }
                    });

                    if (!wallet) {
                        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
                    }

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

                    // Log System Transaction
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
                            userId: wallet.userId, 
                        }
                    });
                }
                return NextResponse.json({ status: "ok" });
            }

            // 3. Check if this is a Session Booking (LiveSession)
            const sessionBooking = await prisma.sessionBooking.findFirst({
                 where: { id: payment.notes.bookingId } 
            }) || await prisma.sessionBooking.findFirst({
                 where: { razorpayOrderId: orderId } // Backup for Razorpay Order ID
            });
            
            if (sessionBooking || (payment.notes.type === "SESSION_BOOKING" && payment.notes.bookingId)) {
                 const bookingId = sessionBooking?.id || payment.notes.bookingId;
                 
                 const booking = await prisma.sessionBooking.findUnique({
                     where: { id: bookingId },
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
 
                 if (booking) {
                      if (booking.status !== "confirmed") {
                           await prisma.sessionBooking.update({
                               where: { id: booking.id },
                               data: {
                                   status: "confirmed",
                                   razorpayOrderId: orderId, // Set the specific Razorpay Order ID field - Author: Sanket
                                   razorpayPaymentId: payment.id, // Set the Payment ID for refunds - Author: Sanket
                                   paymentCompletedAt: new Date(),
                               }
                           });

                           // 3a. Handle Commission (Author: Sanket)
                           const { platformFee, teacherNet } = await calculatePlatformCommission(
                               payment.amount,
                               booking.session.teacherId
                           );
                           
                           await prisma.commission.create({
                               data: {
                                   teacherId: booking.session.teacherId,
                                   sessionId: booking.sessionId,
                                   type: "LiveSession",
                                   amount: payment.amount,
                                   commission: platformFee,
                                   netAmount: teacherNet,
                                   status: "Pending"
                               }
                           });
                           
                           // Send confirmation emails
                           try {
                               const { sendTemplatedEmail } = await import("@/lib/email");
                               const sessionDate = new Date(booking.session.scheduledAt!);
                               const sessionTime = sessionDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                               const dateStr = sessionDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
                               const sessionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sessions`;

                               // 1. Send Student Confirmation
                               await sendTemplatedEmail("bookingConfirmation", booking.student.email, "Booking Confirmed! ✅", {
                                   userName: booking.student.name || "Student",
                                   sessionTitle: booking.session.title,
                                   teacherName: booking.session.teacher.user.name || "Instructor",
                                   sessionDate: dateStr,
                                   sessionTime: sessionTime,
                                   duration: booking.session.duration,
                                   sessionUrl: sessionUrl
                               });

                               // 2. Send Teacher Notification
                               if (booking.session.teacher.user.email) {
                                   await sendTemplatedEmail("newBookingNotification", booking.session.teacher.user.email, "New Session Booked! 🎉", {
                                       teacherName: booking.session.teacher.user.name || "Instructor",
                                       studentName: booking.student.name || "Student",
                                       studentEmail: booking.student.email,
                                       sessionTitle: booking.session.title,
                                       sessionDate: dateStr,
                                       sessionTime: sessionTime,
                                       sessionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/teacher/sessions/${booking.session.id}`
                                   });
                               }
                               console.log(`[Email] Booking confirmation sent for booking ${booking.id}`);
                           } catch (emailError) {
                               console.error("[Email] Failed to send booking confirmation emails:", emailError);
                           }

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

                           // 3c. Trigger Referral Reward (Author: Sanket)
                           try {
                               const { rewardReferrer } = await import("@/app/actions/referrals");
                               await rewardReferrer(booking.studentId);
                           } catch (e) {
                               console.error("Failed to trigger referral reward for session booking", e);
                           }
                      }
                      return NextResponse.json({ status: "ok" });
                 }
            }

            // 4. Check if this is a Group Enrollment (Author: Sanket)
            const groupEnrollment = await prisma.groupEnrollment.findFirst({
                where: { razorpayOrderId: orderId }
            });

            if (groupEnrollment) {
                if (groupEnrollment.status !== "Active") {
                    await prisma.groupEnrollment.update({
                        where: { id: groupEnrollment.id },
                        data: { 
                            status: "Active",
                            razorpayPaymentId: payment.id
                        }
                    });

                    // 4a. Handle Commission
                    const groupClass = await prisma.groupClass.findUnique({
                        where: { id: groupEnrollment.classId }
                    });

                    let platformFee = 0;
                    let teacherNet = payment.amount;

                    if (groupClass) {
                         const comm = await calculatePlatformCommission(payment.amount, groupClass.teacherId);
                         platformFee = comm.platformFee;
                         teacherNet = comm.teacherNet;
                    }

                    if (groupClass) {
                        await prisma.commission.create({
                            data: {
                                teacherId: groupClass.teacherId,
                                type: "GroupClass",
                                amount: payment.amount,
                                commission: platformFee,
                                netAmount: teacherNet,
                                status: "Pending"
                            }
                        });
                    }

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
                            description: `Group Class Enrollment: ${groupEnrollment.classId}`,
                            userId: groupEnrollment.studentId,
                        }
                    });

                    console.log(`Group Enrollment ${groupEnrollment.id} completed via Razorpay`);

                    // 4c. Trigger Referral Reward (Author: Sanket)
                    try {
                        const { rewardReferrer } = await import("@/app/actions/referrals");
                        await rewardReferrer(groupEnrollment.studentId);
                    } catch (e) {
                        console.error("Failed to trigger referral reward for group enrollment", e);
                    }
                }
                return NextResponse.json({ status: "ok" });
            }

            console.log(`Razorpay order ${orderId} match not found in local DB`);
        }

        // 5. Handle Gift Card Purchase (Author: Sanket)
        if (event.event === "payment.captured" || event.event === "order.paid") {
            const payment = payload.payment.entity;
            if (payment.notes.type === "GIFT_CARD_PURCHASE") {
                const recipientEmail = payment.notes.recipientEmail;
                const message = payment.notes.message;
                const buyerId = payment.notes.userId;
                const amount = payment.amount / 100; // Paisa to INR

                // Generate unique gift card code
                const code = crypto.randomBytes(4).toString('hex').toUpperCase();

                await prisma.giftCard.create({
                    data: {
                        code,
                        amount,
                        senderId: buyerId,
                        recipientEmail,
                        message,
                        isRedeemed: false
                    }
                });

                // Log System Transaction
                await prisma.systemTransaction.create({
                    data: {
                        amount: payment.amount,
                        currency: payment.currency,
                        status: "SUCCESS",
                        method: payment.method,
                        providerOrderId: payment.order_id,
                        providerPaymentId: payment.id,
                        type: "GIFT_CARD_PURCHASE",
                        description: `Gift Card Purchase for ${recipientEmail}`,
                        userId: buyerId,
                    }
                });

                // Send Gift Card Email (Author: Sanket)
                try {
                    const { sendTemplatedEmail } = await import("@/lib/email");
                    await sendTemplatedEmail(
                        "giftCardReceived",
                        recipientEmail,
                        "You've received a Gift Card! 🎁",
                        {
                            amount: `${amount} ${payment.currency}`,
                            code: code,
                            message: message || "Enjoy your learning journey!",
                            buyerName: payment.notes.userName || "A friend"
                        }
                    );
                } catch (emailError) {
                    console.error("Failed to send gift card email", emailError);
                }

                return NextResponse.json({ status: "ok" });
            }
        }

        // Handle Subscription Events
        if (event.event.startsWith("subscription.")) {
            const subscriptionEntity = payload.subscription.entity;
            const razorpaySubscriptionId = subscriptionEntity.id;

            // Use findFirst to avoid potential unique constraint TS issues if client is stale
            const userSubscriptionRaw = await prisma.userSubscription.findFirst({
                where: { razorpaySubscriptionId },
                include: { user: true, plan: true } 
            });
            
            const userSubscription = userSubscriptionRaw as unknown as ExtendedUserSubscription;

            if (userSubscription) {
                if (event.event === "subscription.authenticated" || event.event === "subscription.activated") {
                    await prisma.userSubscription.update({
                        where: { id: userSubscription.id },
                        data: {
                            status: "active",
                            currentPeriodStart: subscriptionEntity.current_start ? new Date(subscriptionEntity.current_start * 1000) : undefined,
                            currentPeriodEnd: subscriptionEntity.current_end ? new Date(subscriptionEntity.current_end * 1000) : undefined,
                        } as any
                    });
                    
                    // Send Activation Email (Author: Sanket)
                    if (userSubscription.user?.email) {
                         try {
                             await sendNotificationEmail(
                                 userSubscription.user.email,
                                 userSubscription.user.name || "Subscriber",
                                 "Subscription Activated! 🚀",
                                 "Welcome to Premium",
                                 `Your subscription to ${userSubscription.plan.name} is now active. Enjoy your benefits!`
                             );
                         } catch (e) {
                             console.error("Failed to send subscription activation email", e);
                         }
                    }

                    console.log(`Subscription ${razorpaySubscriptionId} activated`);
                }

                if (event.event === "subscription.charged") {
                     // Payment successful for renewal
                     const payment = payload.payment.entity;
                     
                     await prisma.userSubscription.update({
                        where: { id: userSubscription.id },
                        data: {
                            status: "active",
                            currentPeriodStart: subscriptionEntity.current_start ? new Date(subscriptionEntity.current_start * 1000) : undefined,
                            currentPeriodEnd: subscriptionEntity.current_end ? new Date(subscriptionEntity.current_end * 1000) : undefined,
                        } as any
                    });

                    // Log Notification
                    await prisma.notification.create({
                        data: {
                            userId: userSubscription.userId,
                            title: "Subscription Renewed",
                            message: "Your subscription has been successfully renewed.",
                            type: "Billing" as any,
                        }
                    });
                    
                    // Log Transaction
                    await prisma.systemTransaction.create({
                        data: {
                            amount: payment.amount,
                            currency: payment.currency,
                            status: "SUCCESS",
                            method: payment.method,
                            providerOrderId: payment.order_id, // Razorpay subscription payment has order_id too
                            providerPaymentId: payment.id,
                            type: "SUBSCRIPTION_RENEWAL" as any,
                            description: `Subscription Renewal: ${userSubscription.planId}`,
                            userId: userSubscription.userId,
                        }
                    });
                     console.log(`Subscription ${razorpaySubscriptionId} charged/renewed`);

                     // Send Renewal Receipt Email
                     if (userSubscription.user?.email) {
                         await sendReceiptEmail(
                             userSubscription.user.email,
                             userSubscription.user.name || "Subscriber",
                             `Subscription Renewal: ${userSubscription.plan.name}`,
                             (payment.amount / 100).toFixed(2) + " " + payment.currency,
                             payment.id
                         );
                     }
                }

                if (event.event === "subscription.cancelled") {
                     await prisma.userSubscription.update({
                        where: { id: userSubscription.id },
                        data: {
                            status: "canceled",
                            cancelAtPeriodEnd: false
                        }
                    });
                    console.log(`Subscription ${razorpaySubscriptionId} cancelled`);

                    // Send Cancellation Email
                    if (userSubscription.user?.email) {
                        await sendNotificationEmail(
                            userSubscription.user.email,
                            userSubscription.user.name || "Subscriber",
                            "Subscription Cancelled",
                            "We're sorry to see you go",
                            `Your subscription to ${userSubscription.plan.name} has been cancelled. You will retain access until the end of your current billing period.`
                        );
                    }
                }
            } else {
                console.log(`Subscription ${razorpaySubscriptionId} not found in local DB`);
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Razorpay Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
