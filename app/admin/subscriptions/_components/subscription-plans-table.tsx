"use client";

import { SubscriptionPlan } from "@prisma/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import { deleteSubscriptionPlan, updateSubscriptionPlan } from "@/app/actions/admin-subscriptions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
import { useState, useEffect } from "react";
import { SubscriptionPlanDialog } from "./subscription-plan-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubscriptionPlansTableProps {
    plans: SubscriptionPlan[];
}

export function SubscriptionPlansTable({ plans }: SubscriptionPlansTableProps) {
    const router = useRouter();
    const [userCountry, setUserCountry] = useState<string>("India");

    useEffect(() => {
        const fetchUser = async () => {
            const { data: session } = await authClient.getSession();
            if (session?.user) {
                setUserCountry((session.user as any).country || "India");
            }
        };
        fetchUser();
    }, []);

    const handleDelete = async (id: string) => {
        const res = await deleteSubscriptionPlan(id);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Plan deleted successfully");
        }
    };

    const handleToggleDefault = async (plan: SubscriptionPlan) => {
        // Toggle logic: If enabling, disable others of same role? 
        // For simplicity, just toggle.
        const res = await updateSubscriptionPlan(plan.id, { isDefault: !plan.isDefault });
        if (res.success) {
            toast.success("Default status updated");
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead className="text-center">Active / Default</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {plans.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                No subscription plans found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        plans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-medium">
                                    {plan.name}
                                    {plan.razorpayPlanId && <div className="text-xs text-muted-foreground">{plan.razorpayPlanId}</div>}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{plan.role}</Badge>
                                </TableCell>
                                <TableCell>
                                    {formatPriceSimple(plan.price, userCountry)}/{plan.interval}
                                </TableCell>
                                <TableCell>
                                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                                        {plan.features.slice(0, 2).map((f, i) => (
                                            <li key={i} className="truncate max-w-[200px]">{f}</li>
                                        ))}
                                        {plan.features.length > 2 && <li>+{plan.features.length - 2} more</li>}
                                    </ul>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleToggleDefault(plan)}
                                        className={plan.isDefault ? "text-green-600" : "text-muted-foreground"}
                                        title="Toggle Default Status"
                                    >
                                        {plan.isDefault ? <IconCheck className="h-4 w-4" /> : <IconX className="h-4 w-4" />}
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <SubscriptionPlanDialog plan={plan} />
                                        
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive">
                                                    <IconTrash className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the plan "{plan.name}". 
                                                        Make sure no active subscribers are using it.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(plan.id)} className="bg-destructive">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
