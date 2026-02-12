"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";  // Verify if component exists, usually standard shadcn
import { createGroupClass } from "@/app/actions/groups";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox"; // Verify existence
import { getCurrencyConfig } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
import { useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CreateGroupFormProps {
    subjects: { id: string, name: string }[];
}

export function CreateGroupForm({ subjects = [] }: CreateGroupFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [subjectId, setSubjectId] = useState<string>("");
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

    async function onSubmit(formData: FormData) {
        setLoading(true);

        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const scheduledAt = formData.get("scheduledAt") as string;
        const duration = Number(formData.get("duration"));
        const price = Number(formData.get("price"));
        const maxStudents = Number(formData.get("maxStudents"));
        const isAdvertised = formData.get("isAdvertised") === "on";
        const isFreeTrialEligible = formData.get("isFreeTrialEligible") === "on";  // Free trial option - Author: Sanket
        const bannerUrl = formData.get("bannerUrl") as string;

        if (maxStudents > 12) {
            toast.error("Error", { description: "Maximum students allowed is 12" });
            setLoading(false);
            return;
        }

        try {
            const result = await createGroupClass({
                title,
                description,
                scheduledAt: new Date(scheduledAt),
                duration,
                price,
                maxStudents,
                isAdvertised,
                isFreeTrialEligible,  // Include free trial flag - Author: Sanket
                subjectId, // Save selected subject ID - Author: Sanket
                bannerUrl
            });

            if (result.error) {
                toast.error("Error", { description: result.error });
            } else {
                toast.success("Success", { description: "Group class created" });
                router.push("/teacher/groups");
                router.refresh();
            }
        } catch (error) {
            toast.error("Error", { description: "Something went wrong" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={onSubmit} className="space-y-6 max-w-2xl">
            <div className="space-y-2">
                <Label htmlFor="title">Class Title</Label>
                <Input id="title" name="title" required placeholder="Python Bootcamp" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required placeholder="What will students learn?" />
            </div>

            <div className="space-y-2">
                <Label>Subject</Label>
                <Select onValueChange={setSubjectId} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                        {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="scheduledAt">Date & Time</Label>
                    <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="duration">Duration (mins)</Label>
                    <Input id="duration" name="duration" type="number" defaultValue="60" required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="maxStudents">Max Students (Max 12)</Label>
                    <Input id="maxStudents" name="maxStudents" type="number" defaultValue="10" max="12" required />
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
                            min="0" 
                            className="pl-8"
                            required 
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2 border p-4 rounded-md">
                <Checkbox id="isAdvertised" name="isAdvertised" />
                <div>
                    <Label htmlFor="isAdvertised" className="font-bold">Advertise this Class (Package)</Label>
                    <p className="text-xs text-muted-foreground">This will display the class on the Find Mentor marketplace.</p>
                </div>
            </div>

            {/* Free Trial Option - Author: Sanket */}
            <div className="flex items-center space-x-2 border p-4 rounded-md bg-blue-50/50 dark:bg-blue-950/20">
                <Checkbox id="isFreeTrialEligible" name="isFreeTrialEligible" />
                <div>
                    <Label htmlFor="isFreeTrialEligible" className="font-bold">Offer as Free Trial Class</Label>
                    <p className="text-xs text-muted-foreground">
                        Students can join this class for free (one free trial per student with you).
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="bannerUrl">Banner Image URL (Optional)</Label>
                <Input id="bannerUrl" name="bannerUrl" placeholder="https://..." />
            </div>

            <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Class"}
            </Button>
        </form>
    );
}
