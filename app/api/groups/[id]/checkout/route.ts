import { NextRequest, NextResponse } from "next/server";
import { joinGroupClass } from "@/app/actions/groups";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await req.json();
    const { couponCode } = body;

    // Use the existing joinGroupClass action logic
    // Author: Sanket - Using type narrowing to resolve union type property access
    const result = await joinGroupClass(id, "online", couponCode) as any;

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Handle free enrollment (price 0)
    if (result.success && !result.requiresPayment) {
      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/groups?booking=success`,
        isFree: true
      });
    }

    // For paid enrollment, return Razorpay details
    return NextResponse.json({
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      keyId: result.keyId,
      courseDescription: `Enrollment for ${result.groupTitle}`,
      user: result.user,
      isFree: false
    });

  } catch (error: any) {
    console.error("Group checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process enrollment" },
      { status: 500 }
    );
  }
}
