import { NextResponse } from "next/server";

/**
 * Student wallet withdrawals are disabled: there is no payout flow behind them,
 * so the old handler simply debited the balance and paid nothing out.
 */
export async function POST() {
    return NextResponse.json({ error: "Withdrawals are not available" }, { status: 403 });
}
