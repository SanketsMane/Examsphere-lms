import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { getRazorpayInstance, getRazorpayKeyId, isRazorpayConfigured, PAYMENTS_UNAVAILABLE_MESSAGE, RazorpayNotConfiguredError } from "@/lib/razorpay";
import { toPaise } from "@/lib/money";

/**
 * Create Razorpay Order for wallet recharge
 * @author Sanket
 */
export async function POST(req: NextRequest) {
    try {
        const user = await requireUser();

        if (!(await isRazorpayConfigured())) {
            return NextResponse.json({ error: PAYMENTS_UNAVAILABLE_MESSAGE }, { status: 503 });
        }
        const { amount, currencySymbol: userCurrencySymbol } = await req.json(); // Accept user's currency symbol for better error messages

        // Fetch dynamic settings (Author: Sanket)
        const settings = await prisma.siteSettings.findFirst();
        const minRecharge = settings?.minWalletRecharge || 100;
        const currencyCode = settings?.currencyCode || "INR";
        const currencySymbol = settings?.currencySymbol || "₹";

        const localAmount = Number(amount);
        if (!Number.isInteger(localAmount)) {
            return NextResponse.json({ error: "Enter a whole rupee amount" }, { status: 400 });
        }
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
        const amountInPaisa = toPaise(localAmount);

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
                // Zero until the payment is captured: a positive pending row showed
                // up as money received in the history. The webhook sets the real
                // amount from metadata.requestedAmount when it credits the wallet.
                amount: 0,
                balanceBefore: wallet ? wallet.balance : 0,
                balanceAfter: wallet ? wallet.balance : 0,
                description: "Wallet Recharge (Pending)",
                metadata: {
                    status: "pending",
                    provider: "razorpay",
                    requestedAmount: localAmount,
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
            keyId: await getRazorpayKeyId(),
            user: {
                name: user.name,
                email: user.email,
            }
        });

    } catch (error: any) {
        if (error instanceof RazorpayNotConfiguredError) {
            return NextResponse.json({ error: PAYMENTS_UNAVAILABLE_MESSAGE }, { status: 503 });
        }
        console.error("Wallet recharge error:", error);
        return NextResponse.json(
            { error: "Could not start the payment. Please try again in a moment." },
            { status: 500 }
        );
    }
}
