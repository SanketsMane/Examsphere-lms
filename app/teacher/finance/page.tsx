import { prisma } from "@/lib/db";

import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/format";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Banknote, History, AlertCircle } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { WithdrawForm } from "./_components/withdraw-form";
import { getCurrencyData, convertPrice } from "@/lib/currency";

export default async function TeacherFinancePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user || (session.user as any).role !== "teacher") {
        redirect("/");
    }

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            payoutRequests: {
                orderBy: { createdAt: "desc" }
            }
        }
    });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { country: true }
    });

    if (!teacher) return <div>Teacher profile not found</div>;

    const totalEarnings = Number(teacher.totalEarnings);
    const totalPaidOut = teacher.payoutRequests
        .filter(p => p.status !== "Rejected" && p.status !== "Failed")
        .reduce((sum, p) => sum + Number(p.requestedAmount), 0);

    const currentBalance = totalEarnings - totalPaidOut;
    const { code: currencyCode } = getCurrencyData(user?.country);
    
    const displayPrice = (price: number) => {
        const converted = convertPrice(price, user?.country);
        return formatPrice(converted, currencyCode);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Financials</h1>
                <p className="text-muted-foreground">Manage your earnings and payouts</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{displayPrice(totalEarnings)}</div>
                        <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                        <Banknote className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{displayPrice(currentBalance)}</div>
                        <p className="text-xs text-muted-foreground">Available for withdrawal</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
                        {teacher.isVerified ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
                        ) : (
                            <Badge variant="destructive">Unverified</Badge>
                        )}
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mt-2">
                            {teacher.isVerified
                                ? "You are eligible for payouts"
                                : "Complete verification to request payouts"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                        <TableHead>Processed Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teacher.payoutRequests.map(payout => (
                                        <TableRow key={payout.id}>
                                            <TableCell>{formatDate(payout.createdAt)}</TableCell>
                                            <TableCell>{displayPrice(Number(payout.requestedAmount))}</TableCell>
                                            <TableCell>
                                                <Badge variant={payout.status === 'Completed' ? 'default' : 'secondary'}>
                                                    {payout.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{payout.processedAt ? formatDate(payout.processedAt) : '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                    {teacher.payoutRequests.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                No payout history found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Payout</CardTitle>
                            <CardDescription>Withdraw your available balance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {teacher.isVerified ? (
                                <WithdrawForm
                                    balance={currentBalance}
                                    userId={session.user.id}
                                    country={user?.country}
                                />
                            ) : (
                                <div className="rounded-md bg-yellow-50 p-4">
                                    <div className="flex">
                                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-800">Verification Required</h3>
                                            <div className="mt-2 text-sm text-yellow-700">
                                                <p>Please complete your teacher profile verification before requesting payments.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
