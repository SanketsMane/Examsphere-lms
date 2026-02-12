"use client";

import { useTransition, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconSpeakerphone, IconSend, IconLoader } from "@tabler/icons-react";
import { toast } from "sonner";
import { getTemplates, sendMarketingEmail } from "./actions";

/**
 * Author: Sanket
 */

interface Template {
    id: string;
    name: string;
    slug: string;
}

export default function EmailMarketingPage() {
    const [pending, startTransition] = useTransition();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    useEffect(() => {
        getTemplates()
            .then(setTemplates)
            .catch(() => toast.error("Failed to load templates"))
            .finally(() => setLoadingTemplates(false));
    }, []);

    const handleSubmit = (formData: FormData) => {
        const audience = formData.get("audience");
        const templateId = formData.get("templateId");

        if (!audience || !templateId) {
            toast.error("Please select both audience and template");
            return;
        }

        if (!confirm("Are you sure you want to send this campaign? This action cannot be undone.")) {
            return;
        }

        startTransition(async () => {
            const result = await sendMarketingEmail(null, formData);
            if (result?.error) {
                toast.error(result.error);
            } else if (result?.success) {
                toast.success(result.message);
            }
        });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Email Marketing</h1>
                <p className="text-muted-foreground">Send bulk email campaigns to your users.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IconSpeakerphone className="h-5 w-5" /> New Campaign
                    </CardTitle>
                    <CardDescription>
                        Select your audience and the email template to send.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Audience</label>
                                <Select name="audience" required defaultValue="students">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="students">Students Only</SelectItem>
                                        <SelectItem value="teachers">Teachers Only</SelectItem>
                                        <SelectItem value="all">All Users (Teachers & Students)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground">
                                    Who should receive this email?
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Template</label>
                                <Select name="templateId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingTemplates ? "Loading..." : "Select template"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name} ({t.slug})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground">
                                    Choose an existing template.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                             <div className="flex">
                                <div className="flex-shrink-0">
                                    <IconSpeakerphone className="h-5 w-5 text-amber-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-amber-800">Important Note</h3>
                                    <div className="mt-2 text-sm text-amber-700">
                                        <p>
                                            Emails will be sent immediately. Large campaigns may take some time to process.
                                            Variables like <code>{`\${userName}`}</code> will be automatically replaced for each user.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={pending || loadingTemplates} className="gap-2 min-w-[150px]">
                                {pending ? (
                                    <>
                                        <IconLoader className="h-4 w-4 animate-spin" /> Sending...
                                    </>
                                ) : (
                                    <>
                                        <IconSend className="h-4 w-4" /> Send Campaign
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
