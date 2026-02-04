import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { headers } from "next/headers";
import { getRazorpayInstance, getRazorpayKeyId } from "@/lib/razorpay";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    
    // Parse body for coupon (optional)
    let couponCode: string | undefined;
    try {
        const body = await req.json();
        couponCode = body.couponCode;
    } catch (e) {
        // Body might be empty if no coupon
    }

  try {
    // Verify authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get session details
    const liveSession = await db.liveSession.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            bookings: {
              where: { status: 'confirmed' }
            }
          }
        }
      }
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Validate session is available
    if (liveSession.status !== 'scheduled') {
      return NextResponse.json(
        { error: "Session is not available for booking" },
        { status: 400 }
      );
    }

    // Check if session is full
    if (liveSession.maxParticipants && liveSession._count.bookings >= liveSession.maxParticipants) {
      return NextResponse.json(
        { error: "Session is full" },
        { status: 400 }
      );
    }

    // Check if user already has a booking
    const existingBooking = await db.sessionBooking.findFirst({
      where: {
        sessionId: liveSession.id,
        studentId: userId,
        status: { in: ['confirmed', 'pending'] }
      }
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "You have already booked this session" },
        { status: 400 }
      );
    }

    // Handle Free Sessions (Price === 0)
    if (liveSession.price === 0) {
      const isGroup = liveSession.maxParticipants && liveSession.maxParticipants > 1;

      // Check usage limits
      const freeUsage = await db.freeClassUsage.findUnique({
        where: { studentId: userId }
      });

      if (isGroup) {
          if (freeUsage?.groupUsed) {
            return NextResponse.json(
              { error: "You have already used your free group class." },
              { status: 400 }
            );
          }
      } else {
          // 1-on-1 Demo
          if (freeUsage?.demoUsed) {
            return NextResponse.json(
              { error: "You have already used your free demo session." },
              { status: 400 }
            );
          }

          if (!liveSession.teacher.allowFreeDemo) {
              return NextResponse.json(
                { error: "This teacher does not offer free demo sessions." },
                { status: 400 }
              );
          }
      }

      await db.$transaction(async (tx) => {
        // Record usage
        const updateData: any = {};
        if (isGroup) {
            updateData.groupUsed = true;
            updateData.groupSessionId = liveSession.id;
        } else {
            updateData.demoUsed = true;
            updateData.demoSessionId = liveSession.id;
        }

        await tx.freeClassUsage.upsert({
            where: { studentId: userId },
            create: { 
                studentId: userId, 
                ...updateData
            },
            update: updateData
        });

        // Create confirmed booking
        await tx.sessionBooking.create({
          data: {
            sessionId: liveSession.id,
            studentId: userId,
            status: 'confirmed',
            amount: 0,
            paymentCompletedAt: new Date(),
            razorpayOrderId: `free_${crypto.randomUUID()}` // Dummy ID for unique constraint
          }
        });

        // Create Notification
        await tx.notification.create({
          data: {
            userId: userId,
            title: "Booking Confirmed",
            message: `Your free ${isGroup ? 'group class' : 'demo session'} "${liveSession.title}" is confirmed!`,
            type: "Session"
          }
        });

        // Create Teacher Notification
        await tx.notification.create({
          data: {
            userId: liveSession.teacher.userId,
            title: "New Session Booking",
            message: `${session.user.name} booked "${liveSession.title}"`,
            type: "Session"
          }
        });
      });

      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sessions?booking=success`,
        isFree: true
      });
    }

    // Calculate Price
    let finalPrice = liveSession.price;
    let discountAmount = 0;
    let couponId: string | undefined;

    if (couponCode) {
        const coupon = await db.coupon.findUnique({
            where: { code: couponCode }
        });

        if (coupon && coupon.isActive) {
             const isValid = 
                (!coupon.expiryDate || new Date() <= coupon.expiryDate) &&
                (coupon.usedCount < coupon.usageLimit);
            
            if (isValid) {
                 if (coupon.type === "PERCENTAGE") {
                    discountAmount = Math.round((liveSession.price * coupon.value) / 100);
                 } else {
                    discountAmount = coupon.value;
                 }
                 discountAmount = Math.min(discountAmount, liveSession.price);
                 finalPrice = Math.max(0, liveSession.price - discountAmount);
                 couponId = coupon.id;
            }
        }
    }

    // Prepare for Booking Creation
    const currencyCode = "INR";
    const amountInPaisa = finalPrice; 

    // Handle 100% Discount / Free via Coupon
    if (amountInPaisa === 0) {
         await db.$transaction(async (tx) => {
            // Create confirmed booking directly
            await tx.sessionBooking.create({
              data: {
                sessionId: liveSession.id,
                studentId: userId,
                status: 'confirmed', // Directly confirmed
                amount: 0,
                paymentCompletedAt: new Date(),
                razorpayOrderId: `free_${crypto.randomUUID()}_coupon` // Dummy ID
              }
            });

            // Create Notifications
            await tx.notification.create({
              data: {
                userId: userId,
                title: "Booking Confirmed",
                message: `Your session "${liveSession.title}" is confirmed!`,
                type: "Session"
              }
            });

            await tx.notification.create({
              data: {
                userId: liveSession.teacher.userId,
                title: "New Session Booking",
                message: `${session.user.name} booked "${liveSession.title}"`,
                type: "Session"
              }
            });
         });

         return NextResponse.json({
            url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sessions?booking=success`,
            isFree: true
         });
    }

    // Initialize Razorpay for Paid Sessions
    const razorpay = await getRazorpayInstance();
    if (!razorpay) throw new Error("Razorpay Failed to Initialize");

    // Create pending booking first to get booking ID for receipt
    const booking = await db.sessionBooking.create({
      data: {
        sessionId: liveSession.id,
        studentId: userId,
        status: 'pending',
        amount: amountInPaisa
      }
    });

    // Create Razorpay Order
    const options = {
        amount: amountInPaisa.toString(),
        currency: currencyCode,
        receipt: booking.id,
        notes: {
            type: "SESSION_BOOKING",
            sessionId: liveSession.id,
            bookingId: booking.id,
            userId: userId,
            couponId: couponId || "",
            couponCode: couponCode || ""
        }
    };

    const order = await razorpay.orders.create(options);

    // Update booking with Razorpay Order ID
    await db.sessionBooking.update({
        where: { id: booking.id },
        data: { razorpayOrderId: order.id } 
    });

    return NextResponse.json({
        orderId: order.id,
        amount: amountInPaisa,
        currency: currencyCode,
        keyId: await getRazorpayKeyId(),
        courseName: liveSession.title,
        courseDescription: `Live Session with ${liveSession.teacher.user.name}`,
        isFree: false,
        user: {
            name: session.user.name,
            email: session.user.email,
            contact: "",
        }
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
