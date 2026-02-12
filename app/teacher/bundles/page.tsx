import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Edit, MoreHorizontal, Plus, Trash, Eye } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatPriceSimple } from "@/lib/currency";
import { getTeacherBundles } from "@/app/actions/bundles";
import { CreateBundleDialog } from "./_components/create-bundle-dialog";

export const dynamic = "force-dynamic";

export default async function TeacherBundlesPage() {
    const session = await getSessionWithRole();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        return redirect("/login");
    }

    const { bundles } = await getTeacherBundles();
    const userCountry = (session.user as any).country || "India";

    const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id }
    });
    const isApproved = teacherProfile?.isApproved ?? false;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Session Bundles</h1>
                    <p className="text-muted-foreground">Create packages of sessions to sell at a discount.</p>
                </div>
                {isApproved && (
                    <CreateBundleDialog />
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bundles</CardTitle>
                    <CardDescription>
                        You have created {bundles.length} bundles
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {bundles.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground mb-4">No bundles found. Create your first bundle to attract more students!</p>
                            {isApproved ? (
                                <CreateBundleDialog />
                            ) : (
                                <p className="text-sm text-orange-600 bg-orange-50 inline-block px-3 py-1 rounded-full">
                                    Account approval required to create bundles
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Mobile View: Cards */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {bundles.map((bundle) => (
                                    <div key={bundle.id} className="bg-card border rounded-lg p-4 space-y-3 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold">{bundle.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {bundle.sessionCount} Sessions
                                                </p>
                                            </div>
                                            <Badge variant={bundle.isActive ? "default" : "secondary"}>
                                                {bundle.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <span className="font-bold">{formatPriceSimple(bundle.price || 0, userCountry)}</span>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/bundles/${bundle.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Sessions</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Sales</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bundles.map((bundle) => (
                                            <TableRow key={bundle.id}>
                                                <TableCell className="font-medium">{bundle.title}</TableCell>
                                                <TableCell>{bundle.sessionCount}</TableCell>
                                                <TableCell>{formatPriceSimple(bundle.price || 0, userCountry)}</TableCell>
                                                <TableCell>{(bundle as any)._count?.bookings || 0}</TableCell>
                                                <TableCell>
                                                    <Badge variant={bundle.isActive ? "default" : "secondary"}>
                                                        {bundle.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(bundle.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/bundles/${bundle.id}`}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Public Page
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
