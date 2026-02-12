"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Correct import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getCurrencyConfig } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
import { useEffect } from "react";
// import { updateGroupClass } from "@/app/actions/groups"; // Need to create this

export function EditGroupForm({ group }: { group: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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

    const currencyConfig = getCurrencyConfig(userCountry);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        // Using manual fetch or server action wrapper if I create one.
        // Let's assume standard form action or client component state management.
        // Since I need to create the update action, let's stick to standard flow.
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const maxStudents = Number(formData.get("maxStudents"));

        if (maxStudents > 12) {
            toast.error("Error", { description: "Maximum students allowed is 12" });
            setLoading(false);
            return;
        }

        // Call server action (need to implement updateGroupClass in actions/groups.ts)

        toast.info("Update feature coming shortly (simulated)");
        setLoading(false);
        // router.refresh();
        // router.push("/teacher/groups");
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
            <div className="space-y-2">
                <Label htmlFor="title">Class Title</Label>
                <Input id="title" name="title" defaultValue={group.title} required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={group.description} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="scheduledAt">Date & Time</Label>
                    {/* Format date for input: YYYY-MM-DDThh:mm */}
                    <Input
                        id="scheduledAt"
                        name="scheduledAt"
                        type="datetime-local"
                        defaultValue={new Date(group.scheduledAt).toISOString().slice(0, 16)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="duration">Duration (mins)</Label>
                    <Input id="duration" name="duration" type="number" defaultValue={group.duration} required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="maxStudents">Max Students (Max 12)</Label>
                    <Input id="maxStudents" name="maxStudents" type="number" defaultValue={group.maxStudents} max="12" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price">Price ({currencyConfig.code})</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                            {currencyConfig.symbol}
                        </span>
                        <Input 
                            id="price" 
                            name="price" 
                            type="number" 
                            defaultValue={group.price} 
                            className="pl-8"
                            required 
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2 border p-4 rounded-md">
                <Checkbox id="isAdvertised" name="isAdvertised" defaultChecked={group.isAdvertised} />
                <div>
                    <Label htmlFor="isAdvertised" className="font-bold">Advertise this Class (Package)</Label>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="bannerUrl">Banner Image URL</Label>
                <Input id="bannerUrl" name="bannerUrl" defaultValue={group.bannerUrl || ""} placeholder="https://..." />
            </div>

            <div className="flex gap-4">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
