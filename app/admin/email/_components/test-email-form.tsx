"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { sendTestEmail } from "@/app/admin/email/actions";
import { Loader2, Send } from "lucide-react";

export function TestEmailForm() {
  const [loading, setLoading] = useState(false);

  async function clientAction(formData: FormData) {
    setLoading(true);
    try {
      const result = await sendTestEmail(formData);
      if (result.error) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Success", { description: result.success });
      }
    } catch {
      toast.error("Error", { description: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={clientAction} className="flex flex-col gap-4 max-w-md w-full">
      <div className="flex gap-2">
        <Input 
          type="email" 
          name="email"
          placeholder="Enter recipient email..." 
          required
          className="flex-1"
        />
        <Button disabled={loading} type="submit">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send Test
        </Button>
      </div>
      <p className="text-xs text-muted-foreground italic">
        Enter an email address to verify your SMTP or API configuration.
      </p>
    </form>
  );
}
