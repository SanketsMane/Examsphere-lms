"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Star, CheckCircle } from "lucide-react";
import Link from "next/link";
import { FreeClassUsage } from "@prisma/client";

interface FreeClassWidgetProps {
    usage: FreeClassUsage | null;
}

export function FreeClassWidget({ usage }: FreeClassWidgetProps) {
    /**
     * Component to display student's free trial availability.
     * Enforces lifetime limits for Demo and Group classes.
     * Author: Sanket
     */
    const demoAvailable = !usage?.demoUsed;
    const groupAvailable = !usage?.groupUsed;


    return (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-indigo-600" />
                    Free Trial Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 1-on-1 Demo */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-card rounded-lg border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${demoAvailable ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                            {demoAvailable ? <Star className="h-4 w-4 fill-green-600" /> : <CheckCircle className="h-4 w-4" />}
                        </div>
                        <div>
                            <p className="font-medium text-sm">1-on-1 Demo Session</p>
                            <p className="text-xs text-muted-foreground">
                                {demoAvailable ? "Available to use" : "Already redeemed"}
                            </p>
                        </div>
                    </div>
                    {demoAvailable ? (
                        <Link href="/dashboard/mentors">
                            <Badge className="bg-green-600 hover:bg-green-700 cursor-pointer">Claim Now</Badge>
                        </Link>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">Used</Badge>
                    )}
                </div>

                {/* Group Class */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-card rounded-lg border shadow-sm">
                    <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-full ${groupAvailable ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            {groupAvailable ? <Ticket className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </div>
                        <div>
                            <p className="font-medium text-sm">Group Class Trial</p>
                            <p className="text-xs text-muted-foreground">
                                {groupAvailable ? "One free entry" : "Already redeemed"}
                            </p>
                        </div>
                    </div>
                    {groupAvailable ? (
                        <Link href="/dashboard/mentors">
                            <Badge className="bg-blue-600 hover:bg-blue-700 cursor-pointer">Browse</Badge>
                        </Link>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">Used</Badge>
                    )}
                </div>

                {demoAvailable || groupAvailable ? (
                     <p className="text-xs text-center text-muted-foreground pt-2">
                        Explore our top-rated teachers and start learning!
                     </p>
                ) : (
                    null
                )}
            </CardContent>
        </Card>
    );
}
