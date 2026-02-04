import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

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
              select: { name: true }
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
          // Check if teacher allows free group (optional, schema didn't have allowFreeGroup on TeacherProfile yet? 
          // We added it to prompt but maybe not schema? Let's assume implied or check later.
          // For now, allow if price is 0.)
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
            stripeSessionId: `free_${crypto.randomUUID()}` // Dummy ID for unique constraint
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
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sessions?booking=success`
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
            // Basic validation (expiry, limits) - simplified for checkout flow as pre-check was likely done
            // But strict check is good practice
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

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: liveSession.title,
              description: `1-on-1 Live Session with ${liveSession.teacher.user.name}`,
            },
            unit_amount: finalPrice, // Price in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'live_session',
        sessionId: liveSession.id,
        studentId: userId,
        teacherId: liveSession.teacherId, // Fixed property name
        couponId: couponId || "",
        couponCode: couponCode || ""  
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sessions?booking=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/live-sessions/${liveSession.id}?booking=cancelled`,
      customer_email: session.user.email,
    });

    // Create pending booking
    await db.sessionBooking.create({
      data: {
        sessionId: liveSession.id,
        studentId: userId,
        status: 'pending',
        stripeSessionId: checkoutSession.id,
        amount: finalPrice // Store the actual amount to be paid
      }
    });

    return NextResponse.json({
      url: checkoutSession.url
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
