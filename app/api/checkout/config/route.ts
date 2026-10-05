import { NextResponse } from "next/server";
import { isRazorpayConfigured } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json({ razorpay: await isRazorpayConfigured() });
}
