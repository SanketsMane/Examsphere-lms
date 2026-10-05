"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconMail } from "@tabler/icons-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function SendAnnouncementDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const handleSend = async () => {
        if (!subject || !message) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/teacher/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, message }),
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.error || "Failed to send announcement");
            }

            toast.success(result.message || "Announcement sent");
            setOpen(false);
            setSubject("");
            setMessage("");
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to send announcement");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <IconMail className="h-4 w-4 mr-2" />
                    Send Announcement
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Send Announcement</DialogTitle>
                    <DialogDescription>
                        Send a message to all students enrolled in your courses. They will see it in their notifications.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subject" className="text-right">
                            Subject
                        </Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="col-span-3"
                            placeholder="Important Update"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="message" className="text-right">
                            Message
                        </Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="col-span-3"
                            placeholder="Type your announcement here..."
                            rows={5}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSend} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Message
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
