"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Gift, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * Free Trial Analytics Dashboard
 * Author: Sanket
 * 
 * Shows teachers which students have claimed free trials
 */

interface FreeTrialUsage {
    id: string;
    studentEmail: string;
    sessionType: string;
    usedAt: Date;
    student: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
}

export default function FreeTrialsPage() {
    const [loading, setLoading] = useState(true);
    const [usages, setUsages] = useState<FreeTrialUsage[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch("/api/teacher/free-trials");
                if (!response.ok) throw new Error("Failed to fetch data");
                const data = await response.json();
                setUsages(data.usages || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Free Trial Analytics</h1>
                <p className="text-muted-foreground mt-2">
                    Track which students have claimed free trial sessions with you
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Free Trials</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usages.length}</div>
                        <p className="text-xs text-muted-foreground">Students claimed trials</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Live Sessions</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {usages.filter(u => u.sessionType === "live_session").length}
                        </div>
                        <p className="text-xs text-muted-foreground">1-on-1 trials</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Group Classes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {usages.filter(u => u.sessionType === "group_class").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Group trials</p>
                    </CardContent>
                </Card>
            </div>

            {/* Usage Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Students Who Used Free Trials</CardTitle>
                    <CardDescription>
                        {usages.length === 0 
                            ? "No students have claimed free trials yet" 
                            : `${usages.length} student${usages.length !== 1 ? 's' : ''} claimed free trials`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {usages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No free trials claimed yet</p>
                            <p className="text-sm mt-2">
                                Mark your sessions as "Free Trial Eligible" to attract new students!
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Session Type</TableHead>
                                    <TableHead>Claimed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usages.map((usage) => (
                                    <TableRow key={usage.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={usage.student.image || undefined} />
                                                    <AvatarFallback>
                                                        {usage.student.name?.charAt(0).toUpperCase() || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{usage.student.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {usage.studentEmail}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={usage.sessionType === "live_session" ? "default" : "secondary"}>
                                                {usage.sessionType === "live_session" ? "Live Session" : "Group Class"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDistanceToNow(new Date(usage.usedAt), { addSuffix: true })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
