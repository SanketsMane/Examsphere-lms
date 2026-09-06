"use server";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { updateIssueStatus, escalateIssue } from "@/app/actions/issues";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertTriangle, XCircle, ArrowUpCircle } from "lucide-react";
import { requireAdmin } from "@/app/data/auth/require-roles";

export default async function AdminIssuesPage() {
  await requireAdmin();
    /**
     * Admin dashboard for managing and escalating user issues.
     * Author: Sanket
     */
    const issues = await prisma.issue.findMany({
        orderBy: { createdAt: "desc" },
        include: { reporter: { select: { name: true, email: true } } }
    });

    const escalatedIssues = issues.filter(i => i.isEscalated || i.status === "Escalated");
    const openIssues = issues.filter(i => i.status === "Open" || i.status === "InProgress");
    const resolvedIssues = issues.filter(i => i.status === "Resolved" || i.status === "Closed");
    const disputes = issues.filter(i => i.category === "Dispute" || i.category === "Class / Teacher Dispute");

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Issue Management</h1>
                <p className="text-muted-foreground">Manage and escalate support tickets.</p>
            </div>

            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">All Issues ({issues.length})</TabsTrigger>
                    <TabsTrigger value="disputes" className="text-orange-600 data-[state=active]:text-orange-700">
                        Disputes ({disputes.length})
                    </TabsTrigger>
                    <TabsTrigger value="escalated" className="text-red-500 data-[state=active]:text-red-600">
                        Escalated ({escalatedIssues.length})
                    </TabsTrigger>
                    <TabsTrigger value="open">Open ({openIssues.length})</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved ({resolvedIssues.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                    <IssueTable issues={issues} />
                </TabsContent>
                <TabsContent value="disputes" className="mt-4">
                    <IssueTable issues={disputes} />
                </TabsContent>
                <TabsContent value="escalated" className="mt-4">
                    <IssueTable issues={escalatedIssues} />
                </TabsContent>
                <TabsContent value="open" className="mt-4">
                    <IssueTable issues={openIssues} />
                </TabsContent>
                <TabsContent value="resolved" className="mt-4">
                    <IssueTable issues={resolvedIssues} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function IssueTable({ issues }: { issues: any[] }) {
    if (issues.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                    No issues found in this category.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Reporter</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {issues.map(issue => (
                            <TableRow key={issue.id} className={issue.isEscalated ? "bg-red-50/50" : ""}>
                                <TableCell>{formatDate(issue.createdAt)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{issue.reporter.name}</span>
                                        <span className="text-xs text-muted-foreground">{issue.reporter.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{issue.subject}</div>
                                    <div className="text-xs text-muted-foreground max-w-[200px] truncate">{issue.description}</div>
                                </TableCell>
                                <TableCell>{issue.category}</TableCell>
                                <TableCell>
                                    <Badge variant={issue.priority === 'Critical' ? 'destructive' : 'outline'}>
                                        {issue.priority}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={issue.status} />
                                    {issue.isEscalated && <span className="ml-2 text-xs font-bold text-red-500">⚠ ESCALATED</span>}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        {issue.status !== "Resolved" && issue.status !== "Closed" && (
                                            <>
                                                <form action={async () => {
                                                    "use server";
    await requireAdmin();
                                                    await updateIssueStatus(issue.id, "InProgress");
                                                }}>
                                                    <Button size="icon" variant="ghost" title="Mark In Progress">
                                                        <ArrowUpCircle className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                </form>

                                                <form action={async () => {
                                                    "use server";
    await requireAdmin();
                                                    await updateIssueStatus(issue.id, "Resolved");
                                                }}>
                                                    <Button size="icon" variant="ghost" title="Resolve">
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    </Button>
                                                </form>

                                                {!issue.isEscalated && (
                                                    <form action={async () => {
                                                        "use server";
    await requireAdmin();
                                                        await escalateIssue(issue.id);
                                                    }}>
                                                        <Button size="icon" variant="ghost" title="Escalate">
                                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </form>
                                                )}
                                            </>
                                        )}
                                        <form action={async () => {
                                            "use server";
    await requireAdmin();
                                            await updateIssueStatus(issue.id, "Closed");
                                        }}>
                                            <Button size="icon" variant="ghost" title="Close">
                                                <XCircle className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        </form>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        Open: "bg-blue-100 text-blue-800",
        InProgress: "bg-yellow-100 text-yellow-800",
        Resolved: "bg-green-100 text-green-800",
        Closed: "bg-gray-100 text-gray-800",
        Escalated: "bg-red-100 text-red-800",
    };
    return <Badge variant="secondary" className={styles[status]}>{status}</Badge>;
}
