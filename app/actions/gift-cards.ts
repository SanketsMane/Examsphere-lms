"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { logger } from "@/lib/logger";

/**
 * Gift Card Server Actions
 * Author: Sanket
 */

export async function purchaseGiftCard(data: {
    amount: number;
    recipientEmail: string;
    message?: string;
}) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        const { getRazorpayInstance, getRazorpayKeyId, isRazorpayConfigured, PAYMENTS_UNAVAILABLE_MESSAGE } = await import("@/lib/razorpay");
        if (!(await isRazorpayConfigured())) {
            return { error: PAYMENTS_UNAVAILABLE_MESSAGE, status: 503 };
        }

        if (!Number.isInteger(data.amount) || data.amount < 1 || data.amount > 100000) {
            return { error: "Gift card amount must be a whole rupee amount between ₹1 and ₹1,00,000" };
        }

        const razorpay = await getRazorpayInstance();
        const { toPaise } = await import("@/lib/money");
        const amountInPaisa = toPaise(data.amount);

        const options = {
            amount: amountInPaisa.toString(),
            currency: "INR",
            receipt: `giftcard_${Date.now()}`,
            notes: {
                type: "GIFT_CARD_PURCHASE",
                userId: session.user.id,
                recipientEmail: data.recipientEmail,
                message: data.message || ""
            }
        };

        const order = await razorpay.orders.create(options);

        return { 
            orderId: order.id,
            amount: amountInPaisa,
            currency: "INR",
            keyId: await getRazorpayKeyId(),
            user: {
                name: session.user.name,
                email: session.user.email,
            }
        };
    } catch (error) {
        logger.error("Gift Card Purchase Error", { error });
        return { error: "Failed to initiate purchase" };
    }
}

export async function redeemGiftCard(code: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        const giftCard = await prisma.giftCard.findUnique({
            where: { code }
        });

        if (!giftCard) return { error: "Invalid gift card code" };
        if (giftCard.isRedeemed) return { error: "Gift card already redeemed" };

        const { creditToWallet } = await import("@/lib/wallet-internal");

        await prisma.$transaction(async (tx) => {
            // Conditional update so two concurrent redemptions can't both credit.
            const claimed = await tx.giftCard.updateMany({
                where: { id: giftCard.id, isRedeemed: false },
                data: {
                    isRedeemed: true,
                    redeemedById: session.user.id,
                    redeemedAt: new Date()
                }
            });
            if (claimed.count !== 1) throw new Error("GIFT_CARD_ALREADY_REDEEMED");

            // 2. Credit to wallet with proper audit trail - author: Sanket
            await creditToWallet(
                session.user.id,
                giftCard.amount,
                "ADMIN_CREDIT", // Closest match for external injection
                `Redeemed Gift Card: ${code}`,
                { giftCardId: giftCard.id, code },
                tx
            );
        });

        return { success: true, amount: giftCard.amount };
    } catch (error) {
        if (error instanceof Error && error.message === "GIFT_CARD_ALREADY_REDEEMED") {
            return { error: "Gift card already redeemed" };
        }
        logger.error("Redeem Gift Card Error", { error });
        return { error: "Failed to redeem gift card" };
    }
}
