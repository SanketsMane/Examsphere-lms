"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendBroadcast, BroadcastRecipients } from "@/app/actions/admin-notifications";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

export function NotificationForm() {
  const [isPending, startTransition] = useTransition();
  const [recipients, setRecipients] = useState<BroadcastRecipients>("all");

  const handleSubmit = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;

    if (!title || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    startTransition(async () => {
      const result = await sendBroadcast({
        title,
        message,
        recipients,
      });

      if (result.success) {
        toast.success(`Notification sent to ${result.count} users!`);
        // Reset form manually or by key change, for now simple toast is enough
        (document.getElementById("notification-form") as HTMLFormElement).reset();
      } else {
        toast.error(result.error || "Failed to send notification");
      }
    });
  };

  return (
    <form id="notification-form" action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipients">Send To</Label>
        <Select
          defaultValue="all"
          onValueChange={(val) => setRecipients(val as BroadcastRecipients)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select recipients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="students">All Students</SelectItem>
            <SelectItem value="teachers">All Teachers</SelectItem>
            <SelectItem value="admins">All Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Subject</Label>
        <Input id="title" name="title" placeholder="Notification subject" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Type your message here..."
          rows={6}
          required
        />
      </div>
      <Button className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        {isPending ? "Sending..." : "Send Notification"}
      </Button>
    </form>
  );
}
