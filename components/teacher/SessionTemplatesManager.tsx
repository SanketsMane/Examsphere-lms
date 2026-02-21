"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, CalendarCheck, Clock, Layers, Loader2 } from "lucide-react";
import { getSessionTemplates, deleteSessionTemplate, applyTemplateBatch } from "@/app/actions/session-templates";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { CreateTemplateForm } from "./CreateTemplateForm";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket

/**
 * Session Templates Dashboard Component
 * Author: Sanket
 */

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function SessionTemplatesManager({ subjects = [] }: { subjects?: any[] }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState<any>(null);
    const [userCountry, setUserCountry] = useState<string>("India");

    useEffect(() => {
        const fetchUser = async () => {
            const { data: session } = await authClient.getSession();
            if (session?.user) {
                setUserCountry((session.user as any).country || "India");
            }
        };
        fetchUser();
        loadTemplates();
    }, []);

    useEffect(() => {
        // loadTemplates(); // Moved into the first useEffect
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        const result = await getSessionTemplates();
        if (result.success) {
            setTemplates(result.templates || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        
        const result = await deleteSessionTemplate(id);
        if (result.success) {
            toast.success("Template deleted");
            loadTemplates();
        } else {
            toast.error(result.error || "Failed to delete");
        }
    };

    const handleApply = async () => {
        if (!activeTemplate || selectedDates.length === 0) return;

        setApplying(activeTemplate.id);
        const result = await applyTemplateBatch(activeTemplate.id, selectedDates);
        
        if (result.success) {
            toast.success(`Generated ${result.count} sessions from template!`);
            setIsApplyDialogOpen(false);
            setSelectedDates([]);
        } else {
            toast.error(result.error || "Failed to generate sessions");
        }
        setApplying(null);
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Management Templates
                </h2>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Session Template</DialogTitle>
                            <CardDescription>Define a reusable session configuration.</CardDescription>
                        </DialogHeader>
                        <CreateTemplateForm onSuccess={() => {
                            setIsCreateDialogOpen(false);
                            loadTemplates();
                        }} subjects={subjects} />
                    </DialogContent>
                </Dialog>
            </div>

            {templates.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                        <Layers className="h-12 w-12 text-muted-foreground/30" />
                        <div>
                            <p className="font-medium text-muted-foreground">No templates created yet</p>
                            <p className="text-sm text-muted-foreground">Save your common session configurations to schedule faster.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Template Name</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Recurrence</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{template.title}</span>
                                            <span className="text-xs text-muted-foreground">{template.duration}m • {formatPriceSimple(template.price / 100, userCountry)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{template.subject}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Layers className="h-3 w-3 text-primary" />
                                            {template.recurrenceType}
                                            {template.dayOfWeek !== null && ` (${DAYS[template.dayOfWeek]})`}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            {template.startTime}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => {
                                                    setActiveTemplate(template);
                                                    setIsApplyDialogOpen(true);
                                                }}
                                            >
                                                <CalendarCheck className="h-4 w-4 mr-2" />
                                                Apply
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(template.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Apply Template: {activeTemplate?.title}</DialogTitle>
                        <CardDescription>Select dates to generate sessions with this configuration.</CardDescription>
                    </DialogHeader>
                    <div className="py-4 flex justify-center">
                        <Calendar
                            mode="multiple"
                            selected={selectedDates}
                            onSelect={(dates) => setSelectedDates(dates || [])}
                            className="rounded-md border shadow"
                            disabled={{ before: new Date() }}
                        />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                        {selectedDates.length} dates selected. Sessions will be created at {activeTemplate?.startTime}.
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleApply} 
                            disabled={selectedDates.length === 0 || applying !== null}
                        >
                            {applying === activeTemplate?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate {selectedDates.length} Sessions
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
