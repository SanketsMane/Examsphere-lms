"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    return (
        <Button
            variant="outline"
            className="border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
            disabled={pending}
            onClick={() => startTransition(() => router.refresh())}
        >
            <RefreshCw className={`mr-2 h-4 w-4 ${pending ? "animate-spin" : ""}`} />
            Refresh
        </Button>
    );
}
