import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { IssueStatusBadge } from "../_components/issue-status-badge";

export const dynamic = "force-dynamic";

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requireUser();
    if (!user) return null;
    const { id } = await params;

    // Scoped to the reporter so ticket ids can't be used to read other users' tickets
    const issue = await prisma.issue.findFirst({
        where: { id, reporterId: user.id },
        select: {
            id: true,
            subject: true,
            description: true,
            category: true,
            priority: true,
            status: true,
            isEscalated: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!issue) notFound();

    return (
        <div className="space-y-6 max-w-3xl">
            <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
                <Link href="/dashboard/issues">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Support Tickets
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl">{issue.subject}</CardTitle>
                            <CardDescription>
                                Ticket #{issue.id.slice(-8).toUpperCase()} · Opened {formatDate(issue.createdAt)}
                            </CardDescription>
                        </div>
                        <IssueStatusBadge status={issue.status} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{issue.category}</Badge>
                        <Badge variant="outline">{issue.priority} priority</Badge>
                        {issue.isEscalated && <Badge variant="destructive">Escalated</Badge>}
                    </div>

                    <div>
                        <h2 className="text-sm font-medium text-muted-foreground mb-2">Description</h2>
                        <p className="whitespace-pre-wrap break-words">{issue.description}</p>
                    </div>

                    <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                        Last updated {formatDate(issue.updatedAt)}. Our team replies by email to your
                        registered address, and the status above changes as your ticket is worked on.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
