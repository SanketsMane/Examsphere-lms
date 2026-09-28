"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTransition } from "react";
import { toast } from "sonner";
import { publishCourse } from "../actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface CourseActionsProps {
    courseId: string;
    status: string;
    isTeacher: boolean;
}

export function CourseActions({ courseId, status, isTeacher }: CourseActionsProps) {
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const handlePublish = () => {
        startTransition(async () => {
            const result = await publishCourse(courseId);
            if (result.status === "success") {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        });
    };

    const StatusBadge = () => {
        switch (status) {
            case "Published":
                return <Badge className="bg-green-500">Published</Badge>;
            case "Pending":
                return <Badge className="bg-yellow-500">Under Review</Badge>;
            case "Draft":
                return <Badge variant="secondary">Draft</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="flex items-center gap-4">
            <StatusBadge />

            {(status === "Draft" || status === "Archived") && (
                <Button onClick={handlePublish} disabled={pending} size="sm">
                    {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {status === "Draft" ? "Submit for Review" : "Resubmit for Review"}
                </Button>
            )}
        </div>
    );
}
