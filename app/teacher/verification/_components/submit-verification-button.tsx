"use client";

import { Button } from "@/components/ui/button";
import { submitVerification } from "@/app/actions/teacher-verification";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

export function SubmitVerificationButton({ hasIdentityDocument = true }: { hasIdentityDocument?: boolean }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const result = await submitVerification();
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success("Application submitted. It is now awaiting admin approval.");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to submit verification");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-2">
            {!hasIdentityDocument && (
                <p className="text-sm text-muted-foreground">Upload your identity document to submit.</p>
            )}
            <Button
                onClick={handleSubmit}
                disabled={isLoading || !hasIdentityDocument}
                size="lg"
                className="w-full md:w-auto bg-green-600 hover:bg-green-700"
            >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit for Approval
            </Button>
        </div>
    );
}
