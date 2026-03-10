import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconCreditCard, IconTrendingUp, IconDownload, IconWallet } from "@tabler/icons-react";
import { prisma as db } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";
import { formatPrice } from "@/lib/currency";

/**
 * Author: Sanket
 */

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  await requireAdmin();

  const enrollments = await db.enrollment.findMany({
    include: {
      User: true,
      Course: true,
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize,
  });

  // Calculate total revenue from all active enrollments - Author: Sanket
  const revenueData = await db.enrollment.aggregate({
    where: { status: 'Active' },
    _sum: {
      amount: true
    }
  });
  const totalRevenue = revenueData._sum.amount || 0;

  // Get true counts for all statuses - Author: Sanket
  const stats = {
    total: await db.enrollment.count(),
    active: await db.enrollment.count({ where: { status: 'Active' } }),
    pending: await db.enrollment.count({ where: { status: 'Pending' } }),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <IconCreditCard className="h-8 w-8" />
            Payments & Transactions
          </h1>
          <p className="text-muted-foreground">Monitor platform revenue and transactions</p>
        </div>
        <div className="flex gap-2">
            <Link href="/admin/payments/transactions">
                <Button variant="outline">
                    <IconTrendingUp className="mr-2 h-4 w-4" />
                    Transactions
                </Button>
            </Link>
            <Link href="/admin/payments/payouts">
                <Button variant="outline">
                    <IconWallet className="mr-2 h-4 w-4" />
                    Withdrawals
                </Button>
            </Link>
            <Link href="/admin/payments/refunds">
                <Button variant="outline">
                    <IconCreditCard className="mr-2 h-4 w-4" />
                    Refunds
                </Button>
            </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>View all payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{enrollment.Course.title}</p>
                  <p className="text-sm text-muted-foreground">User: {enrollment.User.name}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(enrollment.createdAt), 'PPP p')}</p>
                </div>
                  <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(enrollment.amount)}</p>
                    <p className="text-xs text-muted-foreground">Course Enrollment</p>
                  </div>
                  <Badge variant={enrollment.status === 'Active' ? 'default' : enrollment.status === 'Pending' ? 'secondary' : 'destructive'}>
                    {enrollment.status}
                  </Badge>
                </div>
              </div>
            ))}
            {enrollments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No transactions found</p>
            )}
          </div>
          
          {Math.ceil(stats.total / pageSize) > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" asChild disabled={currentPage <= 1}>
                <Link href={currentPage <= 1 ? "#" : `/admin/payments?page=${currentPage - 1}`} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>Previous</Link>
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {Math.ceil(stats.total / pageSize)}
              </div>
              <Button variant="outline" size="sm" asChild disabled={currentPage >= Math.ceil(stats.total / pageSize)}>
                <Link href={currentPage >= Math.ceil(stats.total / pageSize) ? "#" : `/admin/payments?page=${currentPage + 1}`} className={currentPage >= Math.ceil(stats.total / pageSize) ? "pointer-events-none opacity-50" : ""}>Next</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
