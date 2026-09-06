import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { deductFromWallet } from "@/app/actions/wallet";
import { paiseToRupees } from "@/lib/money";

// ... imports
import { getSiteSettings } from "@/app/data/settings/get-site-settings";

/**
 * Book a live session using wallet balance or Free Class credits
 * @author Sanket
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireUser();
        const { id: sessionId } = await params;

        // Get session details
        const session = await prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: {
                teacher: {
                    include: { user: true }
                },
                // Include bookings to count participants
                bookings: {
                    where: { status: "confirmed" }
                }
            }
        });

        if (!session) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        // 1. Check Group Class Size Limits (Global Rule)
        const settings = await prisma.siteSettings.findFirst();
        const maxGroupSize = settings?.maxGroupClassSize || 12;

        // If it's a group session (maxParticipants > 1 or undefined which might imply group in some contexts, 
        // but usually 1:1 has 1. We'll use the session's own maxParticipants if set, but capped by global limit).
        // If session.maxParticipants is set, respect it. If it's a group class type (implied by > 1), enforce global limit.
        
        const effectiveLimit = session.maxParticipants 
            ? Math.min(session.maxParticipants, maxGroupSize) 
            : 1; // Default to 1 if not specified (safe 1:1 assumption)
            
        // If effective limit > 1, treating as group class for capacity check
        if (effectiveLimit > 1) {
             const currentBookings = session.bookings.length;
             if (currentBookings >= effectiveLimit) {
                 return NextResponse.json(
                     { error: "Class is full (Max capacity reached)" },
                     { status: 400 }
                 );
             }
        }

        // Check if already booked
        const existingBooking = await prisma.sessionBooking.findFirst({
            where: {
                sessionId,
                studentId: user.id
            }
        });

        if (existingBooking) {
            return NextResponse.json(
                { error: "Already booked this session" },
                { status: 400 }
            );
        }

        // 2. Check Free Class Limits
        let markFreeDemoUsed = false;
        let markFreeGroupUsed = false;

        if (session.price === 0) {
            const usage = await prisma.freeClassUsage.findUnique({
                where: { studentId: user.id }
            });

            if (effectiveLimit > 1) {
                // It's a Group Class
                if (usage?.groupUsed) {
                    return NextResponse.json(
                        { error: "You have already used your 1 Free Group Class." },
                        { status: 400 }
                    );
                }
                markFreeGroupUsed = true;
            } else {
                // It's a 1:1 Demo
                if (usage?.demoUsed) {
                    return NextResponse.json(
                        { error: "You have already used your 1 Free Demo Class." },
                        { status: 400 }
                    );
                }
                markFreeDemoUsed = true;
            }
        }

        // Book session and deduct wallet atomically
        const result = await prisma.$transaction(async (tx) => {
            // Deduct from wallet ONLY if price > 0
            if (session.price > 0) {
                await deductFromWallet(
                    user.id,
                    // LiveSession.price is stored in paise; Wallet.balance is in
                    // rupees ("1 point = Rs 1"). Passing session.price straight
                    // through debited 100x — a Rs 499 session took Rs 49,900.
                    paiseToRupees(session.price),
                    "SESSION_BOOKING",
                    `Booked live session: ${session.title}`,
                    { sessionId: session.id, sessionTitle: session.title }
                );
            }

            // Create booking
            const booking = await tx.sessionBooking.create({
                data: {
                    sessionId,
                    studentId: user.id,
                    amount: session.price,
                    status: "confirmed",
                    paymentCompletedAt: new Date()
                }
            });

            // Update session status (Naive: If scheduled, keep scheduled. Only specific logic changes it)
            // Ideally we don't change status to scheduled if it's already scheduled.
            // await tx.liveSession.update({
            //     where: { id: sessionId },
            //     data: { status: "scheduled" }
            // });

            // Create commission for teacher (only if paid)
            if (session.price > 0) {
                const commissionRate = 0.20;
                const commissionAmount = Math.round(session.price * commissionRate);
                const netAmount = session.price - commissionAmount;

                await tx.commission.create({
                    data: {
                        teacherId: session.teacherId,
                        amount: netAmount,
                        commission: commissionAmount,
                        commissionAmount,
                        netAmount,
                        type: "LiveSession",
                        status: "Pending",
                        description: `Live session: ${session.title}`,
                        metadata: {
                            sessionId: session.id,
                            bookingId: booking.id,
                            studentId: user.id
                        }
                    }
                });
            }

            // Update Free Class Usage if applicable
            if (markFreeDemoUsed || markFreeGroupUsed) {
                await tx.freeClassUsage.upsert({
                    where: { studentId: user.id },
                    create: {
                        studentId: user.id,
                        demoUsed: markFreeDemoUsed,
                        groupUsed: markFreeGroupUsed,
                        demoSessionId: markFreeDemoUsed ? sessionId : undefined,
                        groupSessionId: markFreeGroupUsed ? sessionId : undefined
                    },
                    update: {
                        demoUsed: markFreeDemoUsed ? true : undefined,
                        groupUsed: markFreeGroupUsed ? true : undefined,
                        demoSessionId: markFreeDemoUsed ? sessionId : undefined,
                        groupSessionId: markFreeGroupUsed ? sessionId : undefined
                    }
                });
            }

            // Create notification
            await tx.notification.create({
                data: {
                    userId: user.id,
                    title: "Session Booked Successfully",
                    message: `You've successfully booked "${session.title}"${session.price === 0 ? " (Free)" : " using your wallet"}.`,
                    type: "Session"
                }
            });

            return booking;
        });

        return NextResponse.json({
            success: true,
            bookingId: result.id,
            message: session.price === 0 ? "Free class booked successfully" : "Successfully booked session using wallet"
        });

    } catch (error: any) {
        console.error("Wallet session booking error:", error);

        if (error.message?.includes("Insufficient balance")) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to book session" },
            { status: 500 }
        );
    }
}
