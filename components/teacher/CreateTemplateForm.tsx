"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createSessionTemplate } from "@/app/actions/session-templates";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Create Session Template Form
 * Author: Sanket
 */

const templateSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().optional(),
    subject: z.string().min(2, "Subject is required"),
    duration: z.coerce.number().min(15).max(180),
    price: z.coerce.number().min(100),
    recurrenceType: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]),
    dayOfWeek: z.coerce.number().min(0).max(6).optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const SUBJECTS = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Programming", "Web Development", "Data Science", "English", "Business",
    "Marketing", "Design", "Other"
];

const RECURRENCE_TYPES = [
    { value: "NONE", label: "No Recurrence" },
    { value: "DAILY", label: "Daily" },
    { value: "WEEKLY", label: "Weekly" },
];

export function CreateTemplateForm({ onSuccess, subjects = [] }: { onSuccess: () => void, subjects?: { id: string, name: string }[] }) {
    const [loading, setLoading] = useState(false);

    const form = useForm<TemplateFormData>({
        resolver: zodResolver(templateSchema),
        defaultValues: {
            recurrenceType: "NONE",
            duration: 60,
            price: 500,
            startTime: "10:00",
        }
    });

    const watchedRecurrence = form.watch("recurrenceType");

    const onSubmit = async (data: TemplateFormData) => {
        setLoading(true);
        const result = await createSessionTemplate({
            ...data,
            price: data.price * 100 // Convert to cents
        });
        
        if (result.success) {
            toast.success("Template created successfully!");
            onSuccess();
        } else {
            toast.error(result.error || "Failed to create template");
        }
        setLoading(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Template Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Weekly Math Tutoring" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {subjects.length > 0 ? (
                                            subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                                        ) : (
                                            SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duration (mins)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Price (INR)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Time (HH:mm)</FormLabel>
                                <FormControl><Input placeholder="14:30" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="recurrenceType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Recurrence Rule</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {RECURRENCE_TYPES.map(rt => <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {watchedRecurrence === "WEEKLY" && (
                    <FormField
                        control={form.control}
                        name="dayOfWeek"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Day of Week</FormLabel>
                                <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value?.toString()}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                                            <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Template
                </Button>
            </form>
        </Form>
    );
}
