"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { stripe } from "@/lib/stripe";
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

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Kidokool Gift Card - $${data.amount}`,
                            description: `For: ${data.recipientEmail}`,
                        },
                        unit_amount: Math.round(data.amount * 100),
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/gift-cards?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/gift-cards?canceled=true`,
            customer_email: session.user.email!,
            metadata: {
                userId: session.user.id,
                recipientEmail: data.recipientEmail,
                amount: data.amount.toString(),
                message: data.message || "",
                type: "gift_card_purchase"
            }
        });

        return { url: checkoutSession.url };
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

        await prisma.$transaction([
            prisma.giftCard.update({
                where: { id: giftCard.id },
                data: {
                    isRedeemed: true,
                    redeemedById: session.user.id,
                    redeemedAt: new Date()
                }
            }),
            prisma.wallet.upsert({
                where: { userId: session.user.id },
                update: { balance: { increment: giftCard.amount } },
                create: { userId: session.user.id, balance: giftCard.amount }
            })
        ]);

        return { success: true, amount: giftCard.amount };
    } catch (error) {
        logger.error("Redeem Gift Card Error", { error });
        return { error: "Failed to redeem gift card" };
    }
}
