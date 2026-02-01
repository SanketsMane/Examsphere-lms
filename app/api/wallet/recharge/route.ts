import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/app/data/user/require-user";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getCurrencyData, convertPrice } from "@/lib/currency";

/**
 * Create Stripe checkout session for wallet recharge
 * @author Sanket
 */
export async function POST(req: NextRequest) {
    try {
        const user = await requireUser();
        const { amount } = await req.json();

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { country: true }
        });

        const currencyData = getCurrencyData(dbUser?.country);
        const localAmount = amount;

        const minRechargeUsd = 1.25; // ~$1.25
        const maxRechargeUsd = 1250; // ~$1250
        
        const usdAmount = localAmount / currencyData.factor;

        if (usdAmount < minRechargeUsd) {
            return NextResponse.json(
                { error: `Minimum recharge is ${currencyData.symbol}${Math.round(minRechargeUsd * currencyData.factor)}` },
                { status: 400 }
            );
        }

        if (usdAmount > maxRechargeUsd) {
            return NextResponse.json(
                { error: `Maximum recharge is ${currencyData.symbol}${Math.round(maxRechargeUsd * currencyData.factor)}` },
                { status: 400 }
            );
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: currencyData.code.toLowerCase(),
                        product_data: {
                            name: "Wallet Recharge",
                            description: `Add ${currencyData.symbol}${localAmount} to your wallet`,
                        },
                        unit_amount: Math.round(localAmount * 100), // Stripe expects cents/paise/fils
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                type: "wallet_recharge",
                userId: user.id,
                amount: amount.toString(),
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?recharge=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?recharge=cancelled`,
            customer_email: user.email,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Wallet recharge error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
