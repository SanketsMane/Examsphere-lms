"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit } from "lucide-react";
import { createSubject, updateSubject } from "@/app/actions/subjects";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Type definition for Subject based on schema
interface Subject {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
}

interface SubjectDialogProps {
    subject?: Subject;
    trigger?: React.ReactNode;
}

export function SubjectDialog({ subject, trigger }: SubjectDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const action = subject ? updateSubject : createSubject;
            const result = await action({}, formData);

            if (result.success) {
                setOpen(false);
                toast.success(subject ? "Subject updated" : "Subject created");
                router.refresh();
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant={subject ? "ghost" : "default"} size={subject ? "icon" : "default"}>
                        {subject ? <Edit className="h-4 w-4" /> : <><Plus className="mr-2 h-4 w-4" /> Add Subject</>}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{subject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
                    <DialogDescription>
                        {subject ? "Update subject details." : "Create a new subject for group classes."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {subject && <input type="hidden" name="id" value={subject.id} />}

                    <div className="space-y-2">
                        <Label htmlFor="name">Subject Name</Label>
                        <Input id="name" name="name" defaultValue={subject?.name} required placeholder="e.g. Mathematics" />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : (subject ? "Update" : "Create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
