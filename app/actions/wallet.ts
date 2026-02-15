"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/action-security";
import { getCurrencyData, convertPrice } from "@/lib/currency";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

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
export async function getWallet(userId?: string, tx?: Prisma.TransactionClient) {
    const session = await requireUser(); // Always require session first
    
    // QA-004: Fix IDOR - If userId is requested, ensure requester is admin or owner
    if (userId && userId !== session.user.id && (session.user as any).role !== "admin") {
        throw new Error("Unauthorized access to wallet");
    }

    const targetUserId = userId || session.user.id;
    const db = tx || prisma;

    let wallet = await db.wallet.findUnique({
        where: { userId: targetUserId }
    });

    // Create wallet if it doesn't exist (for existing users)
    if (!wallet) {
        wallet = await db.wallet.create({
            data: { userId: targetUserId, balance: 0 }
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
    metadata?: any,
    tx?: Prisma.TransactionClient
) {
    // Validate amount
    if (amount <= 0) {
        throw new Error("Amount must be positive");
    }

    const db = tx || prisma;
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { country: true }
    });

    // Use the potentially transactional getWallet
    // Note: getWallet now checks session, so we might need to rely on the caller ensuring auth if this is a background task.
    // But deductFromWallet is usually user-initiated. 
    // However, if we are in a transaction, we might not want getWallet to re-check auth if it's already checked?
    // The previous getWallet allowed bypassing requireUser if userId was passed.
    // My fix enforces requireUser. This is good.
    
    // But wait, if I call this from `joinGroupClass`, `userId` is passed.
    // `joinGroupClass` has a session.
    // `deductFromWallet` calls `getWallet(userId)`.
    
    // Logic extraction for transaction support
    const execute = async (transactionTx: Prisma.TransactionClient) => {
        const wallet = await getWallet(userId, transactionTx);
        const currency = getCurrencyData(user?.country);

        // Check sufficient balance (internal balance is USD)
        if (wallet.balance < amount) {
            throw new Error(`Insufficient balance. You have ${currency.symbol}${Math.round((wallet.balance || 0) * currency.factor)} but need ${currency.symbol}${Math.round(amount * currency.factor)}`);
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore - amount;

        // Update wallet balance
        const updatedWallet = await transactionTx.wallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter }
        });

        // Create transaction record
        const transaction = await transactionTx.walletTransaction.create({
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
    };

    let result;
    if (tx) {
        result = await execute(tx);
    } else {
        result = await prisma.$transaction(execute);
    }

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
    metadata?: any,
    tx?: Prisma.TransactionClient
) {
    const db = tx || prisma;
    const result = await (db as any).$transaction(async (t: Prisma.TransactionClient) => {
        const wallet = await getWallet(userId, t);
        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + amount;

        const updatedWallet = await t.wallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter }
        });

        const transaction = await t.walletTransaction.create({
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

/**
 * Withdraw funds from wallet
 * @author Sanket
 */
export async function withdrawWalletBalance(
    userId: string,
    amount: number,
    metadata?: any
) {
    if (amount <= 0) throw new Error("Amount must be positive");

    return await prisma.$transaction(async (tx) => {
        const wallet = await getWallet(userId, tx);

        if (wallet.balance < amount) {
            throw new Error("Insufficient balance");
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore - amount;

        const updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter }
        });

        const transaction = await tx.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: "ADMIN_DEBIT", // Using ADMIN_DEBIT to avoid migration, distinguishing via description
                amount: -amount,
                balanceBefore,
                balanceAfter,
                description: "Withdrawal Request",
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
            }
        });

        // In a real app, we would create a PayoutRequest record here
        // await tx.payoutRequest.create({ ... })

        return { wallet: updatedWallet, transaction };
    });
}
