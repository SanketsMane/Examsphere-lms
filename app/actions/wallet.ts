"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/action-security";
import { getCurrencyData, convertPrice } from "@/lib/currency";
import { logger } from "@/lib/logger";

/**
 * Get wallet balance for the current user
 * @author Sanket
 */
export async function getWalletBalance() {
    const session = await requireUser();

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { country: true }
    });

    const wallet = await prisma.wallet.findUnique({
        where: { userId: session.user.id },
        select: { balance: true }
    });

    const rawBalance = wallet?.balance ?? 0;
    
    // Internal balance is USD. We convert it to localized display based on user country.
    // If we want to return the raw balance (USD) and let the frontend format it, that's also fine.
    // But for "points" representation, we usually return the converted value.
    return convertPrice(rawBalance, user?.country);
}

/**
 * Get wallet with full details
 * @author Sanket
 */
export async function getWallet(userId?: string) {
    const session = userId ? { user: { id: userId } } : await requireUser();

    let wallet = await prisma.wallet.findUnique({
        where: { userId: session.user.id }
    });

    // Create wallet if it doesn't exist (for existing users)
    if (!wallet) {
        wallet = await prisma.wallet.create({
            data: { userId: session.user.id, balance: 0 }
        });
    }

    return wallet;
}

/**
 * Get transaction history for the current user
 * @author Sanket
 * @param limit - Number of transactions to fetch (default: 50)
 */
export async function getTransactionHistory(limit: number = 50) {
    const session = await requireUser();

    const wallet = await getWallet(session.user.id);

    const transactions = await prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: limit
    });

    return transactions;
}

/**
 * Internal function to deduct balance from wallet
 * Used by purchase flows (courses, sessions, groups)
 * @author Sanket
 */
export async function deductFromWallet(
    userId: string,
    amount: number,
    type: 'COURSE_PURCHASE' | 'SESSION_BOOKING' | 'GROUP_ENROLLMENT',
    description: string,
    metadata?: any
) {
    // Validate amount
    if (amount <= 0) {
        throw new Error("Amount must be positive");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { country: true }
    });

    const wallet = await getWallet(userId);
    const currency = getCurrencyData(user?.country);

    // Check sufficient balance (internal balance is USD)
    if (wallet.balance < amount) {
        throw new Error(`Insufficient balance. You have ${currency.symbol}${Math.round(wallet.balance * currency.factor)} but need ${currency.symbol}${Math.round(amount * currency.factor)}`);
    }

    // Atomic transaction to deduct balance and create transaction record
    const result = await prisma.$transaction(async (tx) => {
        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore - amount;

        // Update wallet balance
        const updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter }
        });

        // Create transaction record
        const transaction = await tx.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type,
                amount: -amount, // Negative for debit
                balanceBefore,
                balanceAfter,
                description,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
            }
        });

        return { wallet: updatedWallet, transaction };
    });

    logger.info("Wallet deduction", { userId, amount, type, description });
    revalidatePath('/dashboard/wallet');
    return result;
}

/**
 * Internal function to add balance to wallet (refunds, admin credits)
 * @author Sanket
 */
export async function creditToWallet(
    userId: string,
    amount: number,
    type: 'REFUND' | 'ADMIN_CREDIT',
    description: string,
    metadata?: any
) {
    if (amount <= 0) {
        throw new Error("Amount must be positive");
    }

    const wallet = await getWallet(userId);

    const result = await prisma.$transaction(async (tx) => {
        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + amount;

        const updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter }
        });

        const transaction = await tx.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type,
                amount, // Positive for credit
                balanceBefore,
                balanceAfter,
                description,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
            }
        });

        return { wallet: updatedWallet, transaction };
    });

    revalidatePath('/dashboard/wallet');
    return result;
}
