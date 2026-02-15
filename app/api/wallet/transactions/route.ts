import { NextResponse } from "next/server";
import { getTransactionHistory } from "@/app/actions/wallet";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get current user's wallet transactions
 * @author Sanket
 */
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const transactions = await getTransactionHistory(20);

        return NextResponse.json({ status: "success", data: transactions });
    } catch (error: any) {
        console.error("Get wallet transactions error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}
