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

        // Razorpay Flow (Author: Sanket)
        const { getRazorpayInstance, getRazorpayKeyId } = await import("@/lib/razorpay");
        const razorpay = await getRazorpayInstance();
        
        const amountInPaisa = Math.round(data.amount * 100);

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

        const { creditToWallet } = await import("@/app/actions/wallet");

        await prisma.$transaction(async (tx) => {
            // 1. Mark as redeemed
            await tx.giftCard.update({
                where: { id: giftCard.id },
                data: {
                    isRedeemed: true,
                    redeemedById: session.user.id,
                    redeemedAt: new Date()
                }
            });

            // 2. Credit to wallet with proper audit trail - author: Sanket
            await creditToWallet(
                session.user.id,
                giftCard.amount,
                "ADMIN_CREDIT", // Closest match for external injection
                `Redeemed Gift Card: ${code}`,
                { giftCardId: giftCard.id, code },
                tx as any
            );
        });

        return { success: true, amount: giftCard.amount };
    } catch (error) {
        logger.error("Redeem Gift Card Error", { error });
        return { error: "Failed to redeem gift card" };
    }
}
