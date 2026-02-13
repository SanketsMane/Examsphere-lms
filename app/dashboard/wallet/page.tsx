import { requireUser } from "@/app/data/user/require-user";
import { getWallet, getTransactionHistory } from "@/app/actions/wallet";
import { getSiteSettings } from "@/app/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { formatPriceSimple, formatPrice } from "@/lib/currency"; // Added for localization - Author: Sanket
import { RechargeDialog } from "./_components/RechargeDialog";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
    const user = await requireUser();
    const wallet = await getWallet(user.id);
    const transactions = await getTransactionHistory(50);
    const settings = await getSiteSettings();
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
                    <CardTitle className="text-5xl font-bold">{formatPriceSimple(wallet.balance, userCountry)}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
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
                        <Button variant="outline" className="border-white text-white hover:bg-white/10">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
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
                            <p className="text-sm">Add money to your wallet to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((txn) => {
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
                                            <div className={`p-2 rounded-full ${isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {isCredit ? (
                                                    <ArrowDownRight className="h-5 w-5" />
                                                ) : (
                                                    <ArrowUpRight className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{typeLabels[txn.type] || txn.type}</p>
                                                <p className="text-sm text-muted-foreground">{txn.description}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(txn.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                {isCredit ? '+' : ''}{formatPriceSimple(Math.abs(txn.amount), userCountry)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Balance: {formatPriceSimple(txn.balanceAfter, userCountry)}
                                            </p>
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
