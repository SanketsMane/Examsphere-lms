import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash, Power } from "lucide-react";
import Link from "next/link";
import { toggleCouponStatus, deleteCoupon } from "./actions"; // We'll make these client-friendly or wrap them
import { CouponStats } from "./_components/coupon-stats";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  const [coupons, totalCoupons, activeCount] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        _count: {
          select: { usage: true }
        }
      }
    }),
    prisma.coupon.count(),
    prisma.coupon.count({ where: { isActive: true } }),
  ]);

  const totalPages = Math.ceil(totalCoupons / pageSize);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage discount codes and promotions.</p>
        </div>
        <Button asChild>
          <Link href="/admin/coupons/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Coupon
          </Link>
        </Button>
      </div>

      <CouponStats total={totalCoupons} active={activeCount} />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                <TableCell>
                  {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `$${coupon.value}`}
                </TableCell>
                <TableCell className="capitalize text-xs text-muted-foreground">
                    {Array.isArray(coupon.applicableOn) && coupon.applicableOn.length > 0 
                      ? (coupon.applicableOn as string[]).join(", ") 
                      : "Global"}
                </TableCell>
                <TableCell>
                  {coupon._count.usage} / {coupon.usageLimit}
                </TableCell>
                <TableCell>
                  {format(coupon.expiryDate, "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <Badge variant={coupon.isActive ? "default" : "secondary"}>
                    {coupon.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                   {/* Wrapped actions to satisfy type requirements */}
                   <form action={async () => {
                      "use server";
                      await toggleCouponStatus(coupon.id, !coupon.isActive);
                   }} className="inline-block">
                        <Button variant="ghost" size="icon" title={coupon.isActive ? "Deactivate" : "Activate"}>
                            <Power className={`h-4 w-4 ${coupon.isActive ? "text-green-500" : "text-gray-400"}`} />
                        </Button>
                   </form>
                   <form action={async () => {
                      "use server";
                      await deleteCoupon(coupon.id);
                   }} className="inline-block">
                        <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash className="h-4 w-4" />
                        </Button>
                   </form>
                </TableCell>
              </TableRow>
            ))}
            {coupons.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No coupons found. Create one to get started.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" asChild disabled={currentPage <= 1}>
            <Link 
              href={{
                pathname: "/admin/coupons",
                query: { page: currentPage - 1 }
              }} 
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              Previous
            </Link>
          </Button>
          <div className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button variant="outline" size="sm" asChild disabled={currentPage >= totalPages}>
            <Link 
              href={{
                pathname: "/admin/coupons",
                query: { page: currentPage + 1 }
              }} 
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
            >
              Next
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
