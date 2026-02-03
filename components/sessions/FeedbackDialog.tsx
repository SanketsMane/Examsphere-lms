"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FeedbackForm } from "./FeedbackForm";
import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";

/**
 * Feedback Dialog Wrapper
 * Author: Sanket
 */

interface FeedbackDialogProps {
    sessionId: string;
    trigger?: React.ReactNode;
    sessionTitle: string;
}

export function FeedbackDialog({ sessionId, trigger, sessionTitle }: FeedbackDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <MessageSquarePlus className="h-4 w-4" />
                        Give Feedback
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Session Feedback</DialogTitle>
                    <DialogDescription>
                        {sessionTitle}
                    </DialogDescription>
                </DialogHeader>
                <FeedbackForm 
                    sessionId={sessionId} 
                    onSuccess={() => setOpen(false)} 
                />
            </DialogContent>
        </Dialog>
    );
}
