import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  DollarSign,
  Calendar,
  TrendingUp,
  Download,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { getPendingPayouts } from "@/app/data/admin/verification-data";
import { prisma } from "@/lib/db";
import { constructS3Url } from "@/lib/s3-utils";

export const dynamic = "force-dynamic";

export default async function PayoutSystemPage() {
  await requireAdmin();

  const [pendingPayouts, approvedCount, completedCount, monthlyStats] = await Promise.all([
    getPendingPayouts(),
    prisma.payoutRequest.count({ where: { status: 'Approved' } }),
    prisma.payoutRequest.count({ where: { status: 'Completed' } }),
    prisma.payoutRequest.aggregate({
      where: {
        status: 'Completed',
        processedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { requestedAmount: true },
      _count: true,
      _avg: { requestedAmount: true }
    })
  ]);

  const pendingCount = pendingPayouts.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-700'
      case 'approved': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'processed': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Payouts & Earnings</h1>
        <p className="text-muted-foreground">
          Manage teacher payout requests and earnings distribution
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              Ready for processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(monthlyStats._sum.requestedAmount || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month's payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Payout</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(monthlyStats._avg.requestedAmount || 0).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Average request amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payout Requests</CardTitle>
              <CardDescription>
                Teacher payout requests awaiting review and approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPayouts.length > 0 ? pendingPayouts.map((payout) => (
                  <Card key={payout.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={constructS3Url(payout.teacher.user.image || "")} />
                            <AvatarFallback>
                              {payout.teacher.user.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{payout.teacher.user.name || 'Unknown'}</h3>
                            <p className="text-sm text-muted-foreground">{payout.teacher.user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="bg-orange-100 text-orange-700">
                                {payout.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Requested {new Date(payout.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ${Number(payout.requestedAmount).toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Requested Amount
                          </p>
                        </div>
                      </div>
                      
                      {/* Bank Details */}
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-muted-foreground">Bank Account:</span>
                        <span className="font-medium">{payout.bankAccountName}</span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Payout
                        </Button>
                        <Button size="sm" variant="destructive">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending payouts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Payouts</CardTitle>
              <CardDescription>
                Payouts approved and ready for processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPayouts.filter(p => p.status === 'Approved').map((payout) => (
                  <Card key={payout.id} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={constructS3Url(payout.teacher.user.image || "")} />
                            <AvatarFallback>
                              {payout.teacher.user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{payout.teacher.user.name}</h3>
                            <p className="text-sm text-muted-foreground">{payout.teacher.user.email}</p>
                            <Badge variant="outline" className={getStatusColor(payout.status)}>
                              {payout.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ${Number(payout.requestedAmount).toLocaleString()}
                          </div>
                          <Button size="sm" className="mt-2">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Process Payment
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processed Payouts</CardTitle>
              <CardDescription>
                Successfully processed and sent payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Processed payouts will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Payouts</CardTitle>
              <CardDescription>
                Payout requests that were rejected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Rejected payouts will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}