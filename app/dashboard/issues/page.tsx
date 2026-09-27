import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import { IssueStatusBadge } from "./_components/issue-status-badge";

export default async function IssuesPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) return <div>Unauthorized</div>;

    const issues = await prisma.issue.findMany({
        where: { reporterId: session.user.id },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Support Tickets</h1>
                    <p className="text-muted-foreground">Raise a ticket and track its status here.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/issues/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Ticket
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your tickets</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {issues.map(issue => (
                                <TableRow key={issue.id}>
                                    <TableCell>{formatDate(issue.createdAt)}</TableCell>
                                    <TableCell className="font-medium">
                                        <Link href={`/dashboard/issues/${issue.id}`} className="hover:underline">
                                            {issue.subject}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{issue.category}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{issue.priority}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <IssueStatusBadge status={issue.status} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {issues.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No support tickets yet.
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
