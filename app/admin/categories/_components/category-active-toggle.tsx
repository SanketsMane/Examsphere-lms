"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toggleCategoryActive } from "@/app/actions/categories";
import { toast } from "sonner";

export function CategoryActiveToggle({ id, name, isActive }: { id: string; name: string; isActive: boolean }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const onChange = (next: boolean) => {
        startTransition(async () => {
            const result = await toggleCategoryActive(id, next);
            if (result.success) {
                toast.success(next ? `${name} is now active` : `${name} hidden from the site`);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update category status");
            }
        });
    };

    return (
        <Switch
            checked={isActive}
            onCheckedChange={onChange}
            disabled={isPending}
            aria-label={isActive ? `Deactivate ${name}` : `Activate ${name}`}
        />
    );
}
