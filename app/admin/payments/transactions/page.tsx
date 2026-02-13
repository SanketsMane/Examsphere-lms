import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma as db } from "@/lib/db";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  await requireAdmin();

  const transactions = await db.systemTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/payments">
          <Button variant="outline" size="icon">
            <IconArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Transaction Logs</h1>
          <p className="text-muted-foreground">
            Detailed log of all payment activities via Razorpay
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Showing last 100 transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Razorpay ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(tx.createdAt), "PPP p")}
                  </TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.type.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {tx.currency} {(tx.amount / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.status === "SUCCESS"
                          ? "default"
                          : tx.status === "PENDING"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {tx.providerPaymentId || "-"}
                    <div className="text-muted-foreground">
                      {tx.providerOrderId}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No transaction logs found yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
