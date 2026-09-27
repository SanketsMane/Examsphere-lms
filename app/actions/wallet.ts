"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/action-security";
import { convertPrice } from "@/lib/currency";
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
