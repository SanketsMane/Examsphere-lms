"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconArrowLeft, IconTemplate, IconDeviceFloppy } from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createTemplate } from "../actions";

/**
 * Author: Sanket
 */
export default function NewTemplatePage() {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await createTemplate(formData);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Template created successfully");
                // Redirect handled server-side but router refresh helps if needed
                router.refresh(); 
            }
        });
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
             <div className="flex items-center gap-4">
                <Link href="/admin/email/templates">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <IconArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Template</h1>
                    <p className="text-muted-foreground">Add a new email template to the system.</p>
                </div>
            </div>

            <form action={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <IconTemplate className="h-5 w-5" /> Template Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Template Name</label>
                                <Input name="name" placeholder="e.g. Welcome Email" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slug (Unique ID)</label>
                                <Input name="slug" placeholder="e.g. welcomeEmail" required />
                                <p className="text-[10px] text-muted-foreground">Used in code to trigger this email. Must be alphanumeric.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Subject Line</label>
                            <Input name="subject" placeholder="Welcome to Kidokool!" required />
                        </div>

                         <div className="space-y-2">
                            <label className="text-sm font-medium">HTML Content</label>
                            <textarea
                                name="content"
                                className="min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="<html>...</html>"
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="isActive" id="isActive" defaultChecked className="rounded border-gray-300" />
                            <label htmlFor="isActive" className="text-sm font-medium">Active and ready to use</label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Link href="/admin/email/templates">
                                <Button variant="outline" type="button">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={pending} className="gap-2">
                                <IconDeviceFloppy className="h-4 w-4" />
                                {pending ? "Creating..." : "Create Template"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
