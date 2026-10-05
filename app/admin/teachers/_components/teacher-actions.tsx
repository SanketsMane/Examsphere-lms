"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Eye, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { approveTeacher, rejectTeacher } from "@/app/actions/admin-management";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeacherActionsProps {
    userId: string;
    isApproved: boolean;
    isVerified: boolean;
}

export function TeacherActions({ userId, isApproved }: TeacherActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const rejectLabel = isApproved ? "Revoke Approval" : "Reject Application";

    const handleApprove = async () => {
        setLoading(true);
        try {
            const res = await approveTeacher(userId);
            if (res.success) {
                toast.success(res.message);
                router.refresh();
            } else {
                toast.error(res.message || "Failed to approve");
            }
        } catch {
            toast.error("Failed to approve");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason");
            return;
        }

        setLoading(true);
        try {
            const res = await rejectTeacher(userId, rejectionReason);
            if (res.success) {
                toast.warning(res.message);
                router.refresh();
                setIsRejectOpen(false);
                setRejectionReason("");
            } else {
                toast.error(res.message || "Failed to reject");
            }
        } catch {
            toast.error("Failed to reject");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/teachers/${userId}`)}
            >
                <Eye className="w-4 h-4 mr-1" /> View
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={loading}>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Teacher Status</DropdownMenuLabel>
                    {!isApproved && (
                        <DropdownMenuItem onClick={handleApprove} className="text-green-600">
                            <Check className="w-4 h-4 mr-2" /> Approve Application
                        </DropdownMenuItem>
                    )}
                    <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                        <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-amber-600">
                                <X className="w-4 h-4 mr-2" /> {rejectLabel}
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{isApproved ? "Revoke Teacher Approval" : "Reject Teacher Application"}</DialogTitle>
                                <DialogDescription>
                                    Please provide a reason. This will be sent to the teacher.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Reason</Label>
                                    <Textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="e.g. Documents invalid, policy violation..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsRejectOpen(false)} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleReject} disabled={loading || !rejectionReason.trim()}>
                                    {rejectLabel}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
