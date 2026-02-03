import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Banknote, History, AlertCircle, TrendingUp, DollarSign, Clock, Wallet, CheckCircle } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { WithdrawForm } from "./_components/withdraw-form";
import { getTeacherPayoutData } from "@/app/actions/teacher-payouts";

export const dynamic = "force-dynamic";

export default async function TeacherFinancePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user || (session.user as any).role !== "teacher") {
        redirect("/");
    }

    // Fetch comprehensive data using the centralized action
    const data = await getTeacherPayoutData();
    
    // Fallback for user location/currency (if needed for display formatting, though default is USD usually)
    // For simplicity, we'll stick to the data provided by the action which returns numbers.
    // Formatting can be done inline.

    const earningsData = {
        totalEarnings: data.totalEarnings,
        availableForPayout: data.availableForPayout,
        pendingPayouts: data.pendingPayouts,
        totalSessions: data.totalSessions,
        averageSessionEarning: data.averageSessionEarning
    };

    const payoutHistory = data.payoutHistory;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed':
            case 'Paid':
            case 'Processed':
                return <Badge className="bg-green-100 text-green-700">Processed</Badge>;
            case 'Approved':
                return <Badge className="bg-blue-100 text-blue-700">Approved</Badge>;
            case 'Pending':
            case 'UnderReview':
                return <Badge className="bg-orange-100 text-orange-700">Pending</Badge>;
            case 'Rejected':
            case 'Failed':
                return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
            case 'Processing':
                return <Badge className="bg-purple-100 text-purple-700">Processing</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Financials</h1>
                <p className="text-muted-foreground">Manage your earnings and request payouts</p>
            </div>

            {/* Earnings Overview Cards (Ported from Payouts Page) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${earningsData.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">
                            Lifetime earnings
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${earningsData.availableForPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">
                            Ready for withdrawal
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${earningsData.pendingPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">
                            Under review
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg per Session</CardTitle>
                        <Wallet className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${earningsData.averageSessionEarning.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Performance metric
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Payout History Table */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Payout History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Processed</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payoutHistory.map(payout => (
                                        <TableRow key={payout.id}>
                                            <TableCell>{payout.requestedAt}</TableCell>
                                            <TableCell>${payout.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell>
                                                {getStatusBadge(payout.status)}
                                            </TableCell>
                                            <TableCell>{payout.processedAt || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                    {payoutHistory.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                No payout history found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Withdraw Form & Request Payout */}
                <div>
                     <Card>
                        <CardHeader>
                            <CardTitle>Request Payout</CardTitle>
                            <CardDescription>Withdraw available funds</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <WithdrawForm
                                balance={earningsData.availableForPayout}
                                userId={session.user.id}
                                country={(session.user as any).country} 
                            />
                            
                            {earningsData.availableForPayout < 50 && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                                    <div className="text-xs text-yellow-800">
                                        Minimum payout amount is $50.00.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    {/* Additional Info Card */}
                    <Card className="mt-6">
                        <CardHeader>
                             <CardTitle className="text-sm">Information</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground space-y-2">
                             <p>• Payouts are processed within 3-5 business days.</p>
                             <p>• Ensure your bank details are correct in your profile.</p>
                             <p>• Platform fees are deducted automatically from earnings.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
