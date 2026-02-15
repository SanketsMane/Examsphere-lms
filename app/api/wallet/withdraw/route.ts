import { NextResponse } from "next/server";
import { requireUser } from "@/app/data/user/require-user";
import { withdrawWalletBalance } from "@/app/actions/wallet";

/**
 * Withdraw funds from wallet
 * @author Sanket
 */
export async function POST(request: Request) {
    try {
        const user = await requireUser();
        
        if (!user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const { amount } = data;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        const result = await withdrawWalletBalance(user.id, amount);

        return NextResponse.json({ status: "success", data: result });
    } catch (error: any) {
        console.error("Withdraw error:", error);
        return NextResponse.json(
            { error: error.message || "Withdrawal failed" },
            { status: 500 }
        );
    }
}
