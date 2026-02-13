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
import { updateRefundStatus } from "@/app/actions/refunds";
import { getCurrencyData, convertPrice } from "@/lib/currency";
import { RefundStatus } from "@prisma/client";
import { Check, X } from "lucide-react";

export default async function RefundsPage() {
    const refunds = await prisma.refundRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { name: true, email: true, country: true } },
            course: { select: { title: true } }
        }
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Refund Requests</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {refunds.map((refund) => (
                            <TableRow key={refund.id}>
                                <TableCell>{formatDate(refund.createdAt)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{refund.user.name}</span>
                                        <span className="text-xs text-muted-foreground">{refund.user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{refund.course?.title || "N/A"}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>
                                            {formatPrice(
                                                convertPrice(refund.amount, refund.user.country),
                                                getCurrencyData(refund.user.country).code
                                            )}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            ({formatPrice(refund.amount, "USD")})
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={refund.reason}>
                                    {refund.reason}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={refund.status} />
                                </TableCell>
                                <TableCell>
                                    {refund.status === "Pending" && (
                                        <div className="flex items-center gap-2">
                                            <form action={async () => {
                                                "use server";
                                                await updateRefundStatus(refund.id, "Approved");
                                            }}>
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-green-600">
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </form>
                                            <form action={async () => {
                                                "use server";
                                                await updateRefundStatus(refund.id, "Rejected");
                                            }}>
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-red-600">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {refunds.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground">
                                    No refund requests found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: RefundStatus }) {
    const styles: Record<string, string> = {
        Pending: "bg-yellow-100 text-yellow-800",
        Approved: "bg-blue-100 text-blue-800",
        Processed: "bg-green-100 text-green-800",
        Rejected: "bg-red-100 text-red-800",
    };

    return (
        <Badge variant="secondary" className={styles[status] || "bg-gray-100"}>
            {status}
        </Badge>
    );
}
