"use server";

import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { updatePayoutStatus } from "@/app/actions/admin-payouts";
import { getCurrencyData, convertPrice } from "@/lib/currency";
import { PayoutRequestStatus } from "@prisma/client";
import { Check, X } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function PayoutsPage() {
    const payouts = await prisma.payoutRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            teacher: {
                include: { user: { select: { name: true, email: true, country: true } } }
            }
        }
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Bank Details</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payouts.map((payout) => (
                            <TableRow key={payout.id}>
                                <TableCell>{formatDate(payout.createdAt)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{payout.teacher.user.name}</span>
                                        <span className="text-xs text-muted-foreground">{payout.teacher.user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>
                                            {formatPrice(
                                                convertPrice(Number(payout.requestedAmount), payout.teacher.user.country),
                                                getCurrencyData(payout.teacher.user.country).code
                                            )}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            ({formatPrice(Number(payout.requestedAmount), "USD")})
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs">
                                        <p>Bank: {payout.bankName || "N/A"}</p>
                                        <p>Acc: {payout.bankAccountNumber}</p>
                                        <p>Name: {payout.bankAccountName}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={payout.status} />
                                </TableCell>
                                <TableCell>
                                    {payout.status === "Pending" && (
                                        <div className="flex items-center gap-2">
                                            <form action={async () => {
                                                "use server";
                                                await updatePayoutStatus(payout.id, "Approved");
                                            }}>
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-green-600">
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </form>
                                            <form action={async () => {
                                                "use server";
                                                await updatePayoutStatus(payout.id, "Rejected");
                                            }}>
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-red-600">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    )}
                                    {payout.status === "Approved" && (
                                        <form action={async () => {
                                            "use server";
                                            await updatePayoutStatus(payout.id, "Completed");
                                        }}>
                                            <Button size="sm" variant="outline">Mark Paid</Button>
                                        </form>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {payouts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No payout requests found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: PayoutRequestStatus }) {
    const styles: Record<string, string> = {
        Pending: "bg-yellow-100 text-yellow-800",
        Approved: "bg-blue-100 text-blue-800",
        Completed: "bg-green-100 text-green-800",
        Rejected: "bg-red-100 text-red-800",
        Failed: "bg-red-100 text-red-800",
    };

    return (
        <Badge variant="secondary" className={styles[status] || "bg-gray-100"}>
            {status}
        </Badge>
    );
}
