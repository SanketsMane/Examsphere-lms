import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { getRazorpayInstance } from "@/lib/razorpay";

/**
 * Create Razorpay Order for wallet recharge
 * @author Sanket
 */
export async function POST(req: NextRequest) {
    try {
        const user = await requireUser();
        const { amount, currencySymbol: userCurrencySymbol } = await req.json(); // Accept user's currency symbol for better error messages

        // Fetch dynamic settings (Author: Sanket)
        const settings = await prisma.siteSettings.findFirst();
        const minRecharge = settings?.minWalletRecharge || 100;
        const currencyCode = settings?.currencyCode || "INR";
        const currencySymbol = settings?.currencySymbol || "₹";

        const localAmount = amount;
        const maxRecharge = 100000; // 1 Lakh

        if (localAmount < minRecharge) {
            return NextResponse.json(
                { error: `Minimum recharge is ${currencySymbol}${minRecharge.toLocaleString()}` },
                { status: 400 }
            );
        }

        if (localAmount > maxRecharge) {
            return NextResponse.json(
                { error: `Maximum recharge is ${currencySymbol}${maxRecharge.toLocaleString()}` },
                { status: 400 }
            );
        }

        // Initialize Razorpay
        const razorpay = await getRazorpayInstance();

        // Razorpay expects amount in PAISA
        const amountInPaisa = Math.round(localAmount * 100);

        // Create Wallet Transaction Entry (Pending)
        const wallet = await prisma.wallet.findUnique({
            where: { userId: user.id }
        });

        // Ensure wallet exists
        let walletId = wallet?.id;
        if (!walletId) {
            const newWallet = await prisma.wallet.create({
                data: { userId: user.id }
            });
            walletId = newWallet.id;
        }

        const transaction = await prisma.walletTransaction.create({
            data: {
                walletId: walletId!,
                type: "RECHARGE",
                amount: localAmount, // Store in main unit
                balanceBefore: wallet ? wallet.balance : 0,
                balanceAfter: wallet ? wallet.balance : 0, // Will update on success
                description: "Wallet Recharge (Pending)",
                metadata: {
                    status: "pending",
                    provider: "razorpay"
                }
            }
        });

        // Create Razorpay Order
        const options = {
            amount: amountInPaisa.toString(),
            currency: currencyCode,
            receipt: transaction.id,
            notes: {
                userId: user.id,
                transactionId: transaction.id,
                type: "wallet_recharge"
            }
        };

        const order = await razorpay.orders.create(options);

        // Update transaction with Order ID
        await prisma.walletTransaction.update({
            where: { id: transaction.id },
            data: {
                razorpayOrderId: order.id
            }
        });

        return NextResponse.json({
            orderId: order.id,
            amount: amountInPaisa,
            currency: currencyCode,
            keyId: await import("@/lib/razorpay").then(m => m.getRazorpayKeyId()),
            user: {
                name: user.name,
                email: user.email,
            }
        });

    } catch (error: any) {
        console.error("Wallet recharge error:", error);
        if (error.message.includes("Razorpay credentials")) {
             return NextResponse.json({ error: "Payment Gateway Configuration Error" }, { status: 503 });
        }
        return NextResponse.json(
            { error: error.message || "Failed to create order" },
            { status: 500 }
        );
    }
}
