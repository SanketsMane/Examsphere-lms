import { requireUser } from "@/app/data/user/require-user";
import { getWallet, getTransactionHistory } from "@/app/actions/wallet";
import { getSiteSettings } from "@/app/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { formatMoney } from "@/lib/money"; // wallet amounts are whole rupees
import { RechargeDialog } from "./_components/RechargeDialog";
import { RefreshButton } from "./_components/RefreshButton";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
    const user = await requireUser();
    if (!user) return null;
    const wallet = await getWallet(user.id);
    const transactions = await getTransactionHistory(50);
    const settings = await getSiteSettings();
    // Same check getRazorpayInstance() makes; without keys a top-up can only fail
    const gateway = await prisma.siteSettings.findFirst({
        select: { razorpayKeyId: true, razorpayKeySecret: true },
    });
    const canTopUp = Boolean(gateway?.razorpayKeyId && gateway?.razorpayKeySecret);
    const userCountry = (user as any).country || "India";

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <Wallet className="h-8 w-8 text-blue-600" />
                    My Wallet
                </h1>
                <p className="text-muted-foreground">
                    Manage your wallet balance and view transaction history
                </p>
            </div>

            {/* Balance Card */}
            <Card className="mb-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-none shadow-lg">
                <CardHeader>
                    <CardDescription className="text-blue-100">Available Balance</CardDescription>
                    <CardTitle className="text-5xl font-bold">{formatMoney(wallet.balance)}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        {canTopUp ? (
                            <RechargeDialog
                                minRecharge={settings?.minWalletRecharge ?? undefined}
                                currencyCode={settings?.currencyCode}
                                userCountry={userCountry}
                            >
                                <Button className="bg-white text-blue-600 hover:bg-blue-50">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Money
                                </Button>
                            </RechargeDialog>
                        ) : (
                            <Button className="bg-white text-blue-600" disabled>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Money
                            </Button>
                        )}
                        <RefreshButton />
                    </div>
                    {!canTopUp && (
                        <p className="mt-3 text-sm text-blue-100">
                            Online top-up is not available yet.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Your recent wallet transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Wallet className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <p>No transactions yet</p>
                            {canTopUp && <p className="text-sm">Add money to your wallet to get started</p>}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((txn) => {
                                // Recharges are written before payment and only credited by the
                                // gateway webhook, so an unconfirmed one hasn't changed the balance
                                const txnStatus = (txn.metadata as { status?: string } | null)?.status;
                                const isPending = txn.type === "RECHARGE" && (txnStatus === "pending" || txnStatus === "failed");
                                const isCredit = txn.amount > 0;
                                const typeLabels: Record<string, string> = {
                                    RECHARGE: "Wallet Recharge",
                                    COURSE_PURCHASE: "Course Purchase",
                                    SESSION_BOOKING: "Live Session Booking",
                                    GROUP_ENROLLMENT: "Group Class Enrollment",
                                    REFUND: "Refund",
                                    ADMIN_CREDIT: "Admin Credit",
                                    ADMIN_DEBIT: "Admin Debit"
                                };

                                return (
                                    <div
                                        key={txn.id}
                                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${isPending ? 'bg-muted text-muted-foreground' : isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {isPending ? (
                                                    <Clock className="h-5 w-5" />
                                                ) : isCredit ? (
                                                    <ArrowDownRight className="h-5 w-5" />
                                                ) : (
                                                    <ArrowUpRight className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{typeLabels[txn.type] || txn.type}</p>
                                                <p className="text-sm text-muted-foreground">{txn.description}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(txn.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isPending ? (
                                                <>
                                                    <p className="text-lg font-bold text-muted-foreground">
                                                        {formatMoney(Math.abs(txn.amount))}
                                                    </p>
                                                    <Badge variant="secondary">
                                                        {txnStatus === "failed" ? "Failed" : "Pending"}
                                                    </Badge>
                                                </>
                                            ) : (
                                                <>
                                                    <p className={`text-lg font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isCredit ? '+' : '-'}{formatMoney(Math.abs(txn.amount))}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Balance: {formatMoney(txn.balanceAfter)}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
