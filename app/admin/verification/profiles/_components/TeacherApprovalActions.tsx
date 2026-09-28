"use client";

import { approveTeacher, rejectTeacher } from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface TeacherApprovalActionsProps {
    profileId: string;
}

export function TeacherApprovalActions({ profileId }: TeacherApprovalActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [reason, setReason] = useState("");

    const handleApprove = async () => {
        setLoading(true);
        try {
            const res = await approveTeacher(profileId);
            if (res.success) {
                toast.success(res.message);
                router.refresh();
            } else {
                toast.error(res.message || "Failed to approve teacher");
            }
        } catch {
            toast.error("Failed to approve teacher");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason");
            return;
        }
        setLoading(true);
        try {
            const res = await rejectTeacher(profileId, reason);
            if (res.success) {
                toast.success(res.message);
                setRejectOpen(false);
                setReason("");
                router.refresh();
            } else {
                toast.error(res.message || "Failed to reject teacher");
            }
        } catch {
            toast.error("Failed to reject teacher");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2">
            <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Approve
            </Button>
            <Button
                size="sm"
                variant="destructive"
                onClick={() => setRejectOpen(true)}
                disabled={loading}
            >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
            </Button>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Teacher Application</DialogTitle>
                        <DialogDescription>
                            Tell the teacher what to fix. The reason is shared with them by email and notification so they can re-submit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Reason</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Qualification certificate is unreadable, please upload a clearer copy."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={loading || !reason.trim()}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
