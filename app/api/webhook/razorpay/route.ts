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
                    await prisma.enrollment.update({
                        where: { id: enrollment.id },
                        data: { 
                            status: "Active",
                            // Could store payment ID if we added a field, for now status is enough
                        }
                    });
                    console.log(`Enrollment ${enrollment.id} completed via Razorpay`);
                }
                return NextResponse.json({ status: "ok" });
            }

            // 2. Check if this is a Wallet Transaction
            const transaction = await prisma.walletTransaction.findFirst({
                where: { razorpayOrderId: orderId }
            });

            if (transaction) {
                // Check if already processed to avoid double balance
                // We don't have a status field on transaction directly, but we can check metadata or description
                // Or better, we can assume if it exists and we haven't marked it "success" in metadata
                const metadata = transaction.metadata as any;
                
                if (metadata?.status !== "success") {
                    // Update Transaction
                    await prisma.walletTransaction.update({
                        where: { id: transaction.id },
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
                        where: { id: transaction.walletId },
                        data: {
                            balance: { increment: transaction.amount }
                        }
                    });
                    console.log(`Wallet recharge ${transaction.id} completed via Razorpay`);
                }
                return NextResponse.json({ status: "ok" });
            }

            console.log(`Razorpay order ${orderId} match not found in local DB`);
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Razorpay Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
