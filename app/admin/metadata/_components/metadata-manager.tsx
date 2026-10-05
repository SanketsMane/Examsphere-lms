"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MetadataManagerProps {
    title: string;
    items: { id: string; name: string }[];
    onAdd: (name: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    onDelete: (id: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    onImportDefaults?: () => Promise<{ success: boolean; message?: string; error?: string }>;
}

export function MetadataManager({
    title,
    items,
    onAdd,
    onDelete,
    onImportDefaults
}: MetadataManagerProps) {
    const [newItem, setNewItem] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async () => {
        if (!onImportDefaults) return;
        setIsImporting(true);
        try {
            const res = await onImportDefaults();
            if (res.success) {
                toast.success(res.message);
                router.refresh();
            } else {
                toast.error(res.error);
            }
        } catch {
            toast.error("Failed to import defaults");
        } finally {
            setIsImporting(false);
        }
    };
    const router = useRouter();

    const handleAdd = async () => {
        if (!newItem.trim()) return;
        setIsAdding(true);
        try {
            const res = await onAdd(newItem.trim());
            if (res.success) {
                toast.success(res.message);
                setNewItem("");
                router.refresh(); // Refresh server data
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("Failed to add item");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await onDelete(id);
            if (res.success) {
                toast.success(res.message);
                router.refresh();
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("Failed to delete item");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Manage options for {title.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder={`Add new ${title.toLowerCase()}...`}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                    <Button onClick={handleAdd} disabled={isAdding || !newItem.trim()}>
                        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                    {items.map((item) => (
                        <Badge key={item.id} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-2 text-sm justify-between">
                            {item.name}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full hover:bg-destructive hover:text-destructive-foreground p-0 ml-1"
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                            >
                                {deletingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                        </Badge>
                    ))}
                    {items.length === 0 && (
                        <div className="flex w-full flex-col items-start gap-2">
                            <p className="text-sm text-muted-foreground italic">No items found.</p>
                            {onImportDefaults && (
                                <Button variant="outline" size="sm" onClick={handleImport} disabled={isImporting}>
                                    {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Import ExamSphere defaults
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
