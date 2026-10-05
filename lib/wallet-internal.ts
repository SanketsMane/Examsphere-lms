import "server-only";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrencyData } from "@/lib/currency";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

/**
 * Wallet mutations that trust their caller.
 *
 * These used to be exported from a "use server" file, which made each of them a
 * public server action any signed-in user could POST to with an arbitrary userId
 * and amount (e.g. creditToWallet(self, 1_000_000)). Keep them out of any
 * "use server" module; callers must authorise before invoking.
 *
 * Amounts are whole rupees (see lib/money.ts).
 */

type Db = Prisma.TransactionClient;

async function getOrCreateWallet(userId: string, db: Db) {
    const existing = await db.wallet.findUnique({ where: { userId } });
    if (existing) return existing;
    return db.wallet.create({ data: { userId, balance: 0 } });
}

function runInTx<T>(tx: Db | undefined, fn: (t: Db) => Promise<T>): Promise<T> {
    return tx ? fn(tx) : prisma.$transaction(fn);
}

function assertAmount(amount: number) {
    if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error("Amount must be a positive whole number");
    }
}

export async function deductFromWallet(
    userId: string,
    amount: number,
    type: 'COURSE_PURCHASE' | 'SESSION_BOOKING' | 'GROUP_ENROLLMENT',
    description: string,
    metadata?: any,
    tx?: Db
) {
    assertAmount(amount);

    const result = await runInTx(tx, async (t) => {
        const wallet = await getOrCreateWallet(userId, t);

        // Conditional decrement: two concurrent purchases cannot both pass a
        // stale balance check and drive the wallet negative.
        const debited = await t.wallet.updateMany({
            where: { id: wallet.id, balance: { gte: amount } },
            data: { balance: { decrement: amount } },
        });

        if (debited.count !== 1) {
            const user = await t.user.findUnique({ where: { id: userId }, select: { country: true } });
            const currency = getCurrencyData(user?.country);
            const current = (await t.wallet.findUnique({ where: { id: wallet.id } }))?.balance ?? 0;
            throw new Error(`Insufficient balance. You have ${currency.symbol}${Math.round(current * currency.factor)} but need ${currency.symbol}${Math.round(amount * currency.factor)}`);
        }

        const updatedWallet = await t.wallet.findUniqueOrThrow({ where: { id: wallet.id } });

        const transaction = await t.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type,
                amount: -amount,
                balanceBefore: updatedWallet.balance + amount,
                balanceAfter: updatedWallet.balance,
                description,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
            }
        });

        return { wallet: updatedWallet, transaction };
    });

    logger.info("Wallet deduction", { userId, amount, type, description });
    safeRevalidate();
    return result;
}

export async function creditToWallet(
    userId: string,
    amount: number,
    type: 'REFUND' | 'ADMIN_CREDIT',
    description: string,
    metadata?: any,
    tx?: Db
) {
    assertAmount(amount);

    const result = await runInTx(tx, async (t) => {
        const wallet = await getOrCreateWallet(userId, t);

        const updatedWallet = await t.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: amount } }
        });

        const transaction = await t.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type,
                amount,
                balanceBefore: updatedWallet.balance - amount,
                balanceAfter: updatedWallet.balance,
                description,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
            }
        });

        return { wallet: updatedWallet, transaction };
    });

    safeRevalidate();
    return result;
}

/**
 * Not wired to any endpoint: there is no payout flow for student wallets, so
 * debiting here would just destroy the balance. Kept for a future payout flow.
 */
export async function withdrawWalletBalance(
    userId: string,
    amount: number,
    metadata?: any
) {
    assertAmount(amount);

    return prisma.$transaction(async (tx) => {
        const wallet = await getOrCreateWallet(userId, tx);

        const debited = await tx.wallet.updateMany({
            where: { id: wallet.id, balance: { gte: amount } },
            data: { balance: { decrement: amount } },
        });
        if (debited.count !== 1) throw new Error("Insufficient balance");

        const updatedWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });

        const transaction = await tx.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: "ADMIN_DEBIT",
                amount: -amount,
                balanceBefore: updatedWallet.balance + amount,
                balanceAfter: updatedWallet.balance,
                description: "Withdrawal Request",
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
            }
        });

        return { wallet: updatedWallet, transaction };
    });
}

const REFERRAL_REWARD_RUPEES = 10;

export async function rewardReferrer(refereeId: string) {
    try {
        const referral = await prisma.referral.findUnique({
            where: { refereeId },
        });

        if (!referral || referral.status === "completed") return;

        await prisma.$transaction(async (tx) => {
            // Claim first so concurrent payment confirmations can't reward twice.
            const claimed = await tx.referral.updateMany({
                where: { id: referral.id, status: { not: "completed" } },
                data: { status: "completed" }
            });
            if (claimed.count !== 1) return;

            await tx.referralReward.create({
                data: {
                    userId: referral.referrerId,
                    amount: REFERRAL_REWARD_RUPEES,
                    type: "CREDITS",
                }
            });

            await creditToWallet(
                referral.referrerId,
                REFERRAL_REWARD_RUPEES,
                "ADMIN_CREDIT",
                `Referral Reward for user: ${referral.refereeId}`,
                { refereeId: referral.refereeId, referralId: referral.id },
                tx
            );
        });

        logger.info("Referral reward issued", { referrerId: referral.referrerId, refereeId });
    } catch (error) {
        logger.error("Reward Referrer Error", { error });
    }
}

// revalidatePath throws outside a request scope (e.g. scripts); a stale wallet
// page is not worth failing a money movement over.
function safeRevalidate() {
    try {
        revalidatePath('/dashboard/wallet');
    } catch {
        // ignore
    }
}
